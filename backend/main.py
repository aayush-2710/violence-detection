"""
FastAPI backend — Violence Detection System
All endpoints, CORS, model lifecycle, in-memory state.
python -m uvicorn backend.main:app --reload --port 8000
http://127.0.0.1:8000/docs
"""
import io
import os
import uuid
import json
import zipfile
import tempfile
import hashlib
from datetime import datetime
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, Response

from backend.cache_store import compute_hash, get_cached, set_cache
from backend.model_inference import (
    load_model, smart_sample_frames, predict,
    validate_video_duration, get_top_violent_frame_indices,
    get_video_metadata,
)
from backend.gif_generator import generate_gif
from backend.pdf_generator import generate_pdf_report
from backend.telegram_service import send_violence_alert, answer_false_alarm_callback
from backend.frame_upscaler import upscale_frames
"""from cache_store import compute_hash, get_cached, set_cache
from model_inference import (
    load_model, smart_sample_frames, predict,
    validate_video_duration, get_top_violent_frame_indices,
    get_video_metadata,
)
from gif_generator import generate_gif
from pdf_generator import generate_pdf_report
from telegram_service import send_violence_alert, answer_false_alarm_callback
from frame_upscaler import upscale_frames"""

# ─── CONSTANTS ────────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "violence_model_v3.h5") 
LOGO_PATH    = os.path.join(os.path.dirname(__file__), "logo.png")
TELEGRAM_TOKEN   = os.getenv("TELEGRAM_TOKEN", "8537775823:AAFT3Ug14mW5UFheXhhx1a5DXeTERNDEzmM")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "1842853842")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# ─── IN-MEMORY STORES ─────────────────────────────────────────────────────────
# incident_id → {frames_rgb, gif_bytes, prediction, metadata, filename}
_session_store: dict = {}

# ─── APP INIT ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Violence Detection API",
    description="Production-ready CNN+LSTM violence detection backend.",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MODEL LOAD (once at startup) ────────────────────────────────────────────
print("[STARTUP] Loading model...")
model = load_model(MODEL_PATH)
print("[STARTUP] Model loaded.")


# ─── HEALTH ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "loaded",
        "cache_entries": len(_session_store),
        "timestamp": datetime.now().isoformat(),
    }


# ─── ANALYZE ──────────────────────────────────────────────────────────────────
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Main analysis endpoint.
    Steps:
      1. Read video bytes
      2. Hash check → return cache if hit
      3. Validate duration (≤ 3 min)
      4. Smart frame sampling
      5. Predict
      6. Upscale keyframes
      7. Generate GIF (if violence)
      8. Send Telegram alert (if violence)
      9. Store in session
     10. Return full result JSON
    """
    # Validate file type
    allowed_types = {"video/mp4", "video/avi", "video/quicktime", "video/x-matroska", "video/mpeg"}
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    video_bytes = await file.read()

    if len(video_bytes) == 0:
        raise HTTPException(400, "Empty file uploaded.")

    # ── Cache check ──
    video_hash = compute_hash(video_bytes)
    cached = get_cached(video_hash)
    if cached:
        return JSONResponse({**cached, "cached": True})

    # ── Write to temp file (needed for OpenCV) ──
    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    try:
        # ── Duration validation ──
        valid, err_msg = validate_video_duration(tmp_path)
        if not valid:
            raise HTTPException(400, err_msg)

        # ── Frame extraction ──
        raw_frames_rgb, model_frames, metadata = smart_sample_frames(tmp_path)

        # ── Prediction ──
        prediction = predict(model, model_frames)

        # ── Top violent frame indices ──
        top_indices = get_top_violent_frame_indices(raw_frames_rgb, model, n=5)
        keyframes_rgb = [raw_frames_rgb[i] for i in top_indices]

        # ── Upscale keyframes ──
        upscaled_keyframes = upscale_frames(keyframes_rgb)

        # ── GIF generation (violence only) ──
        gif_bytes = None
        if prediction["is_violence"]:
            violent_frames = [raw_frames_rgb[i] for i in top_indices[:8]]
            gif_bytes = generate_gif(violent_frames)

        # ── Incident ID ──
        incident_id = str(uuid.uuid4())[:8].upper()
        filename    = file.filename or "unknown.mp4"
        timestamp   = datetime.now().isoformat()

        # ── Store in session ──
        _session_store[incident_id] = {
            "frames_rgb":          upscaled_keyframes,   # list of np arrays
            "all_frames_rgb":      raw_frames_rgb,       # for zip download
            "gif_bytes":           gif_bytes,
            "prediction":          prediction,
            "metadata":            metadata,
            "filename":            filename,
            "timestamp":           timestamp,
        }

        # ── Telegram alert ──
        telegram_status = {"sent": False, "message": "Not triggered (no violence)."}
        if prediction["is_violence"] and TELEGRAM_TOKEN and TELEGRAM_CHAT_ID:
            ok, msg = send_violence_alert(
                TELEGRAM_TOKEN, TELEGRAM_CHAT_ID,
                prediction["violence_confidence"],
                filename, gif_bytes,
            )
            telegram_status = {"sent": ok, "message": msg}

        # ── Build response ──
        # Convert frames to base64 for JSON transport
        import base64
        from PIL import Image as PILImage

        def frame_to_b64(frame: np.ndarray) -> str:
            img = PILImage.fromarray(frame.astype(np.uint8), "RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=80)
            return base64.b64encode(buf.getvalue()).decode()

        keyframes_b64 = [frame_to_b64(f) for f in upscaled_keyframes]

        result = {
            "incident_id":      incident_id,
            "filename":         filename,
            "timestamp":        timestamp,
            "cached":           False,
            "prediction":       prediction,
            "metadata":         metadata,
            "keyframes_b64":    keyframes_b64,
            "has_gif":          gif_bytes is not None,
            "telegram_status":  telegram_status,
        }

        # Cache result (without raw frames — too large)
        cacheable = {k: v for k, v in result.items() if k != "keyframes_b64"}
        set_cache(video_hash, cacheable)

        return JSONResponse(result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# ─── DOWNLOAD FRAMES (ZIP) ────────────────────────────────────────────────────
@app.get("/download-frames/{incident_id}")
def download_frames(incident_id: str):
    """Download upscaled keyframes as ZIP."""
    store = _session_store.get(incident_id)
    if not store:
        raise HTTPException(404, "Incident not found or session expired.")

    frames = store.get("frames_rgb", [])
    if not frames:
        raise HTTPException(404, "No frames available.")

    from PIL import Image as PILImage

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, frame in enumerate(frames):
            img = PILImage.fromarray(frame.astype(np.uint8), "RGB")
            frame_buf = io.BytesIO()
            img.save(frame_buf, format="PNG")
            frame_buf.seek(0)
            zf.writestr(f"keyframe_{i+1:02d}.png", frame_buf.read())

    zip_buf.seek(0)
    return StreamingResponse(
        zip_buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=frames_{incident_id}.zip"},
    )


# ─── DOWNLOAD GIF ─────────────────────────────────────────────────────────────
@app.get("/download-gif/{incident_id}")
def download_gif(incident_id: str):
    """Download violent frames GIF."""
    store = _session_store.get(incident_id)
    if not store:
        raise HTTPException(404, "Incident not found.")
    gif = store.get("gif_bytes")
    if not gif:
        raise HTTPException(404, "No GIF available (no violence detected or not generated).")

    return Response(
        content=gif,
        media_type="image/gif",
        headers={"Content-Disposition": f"attachment; filename=violence_{incident_id}.gif"},
    )


# ─── DOWNLOAD PDF REPORT ──────────────────────────────────────────────────────
@app.get("/download-report/{incident_id}")
def download_report(incident_id: str):
    """Generate and download PDF incident report."""
    store = _session_store.get(incident_id)
    if not store:
        raise HTTPException(404, "Incident not found or session expired.")

    logo = LOGO_PATH if os.path.exists(LOGO_PATH) else None

    pdf_bytes = generate_pdf_report(
        filename=store["filename"],
        video_metadata=store["metadata"],
        prediction=store["prediction"],
        keyframes_rgb=store["frames_rgb"],
        incident_id=incident_id,
        logo_path=logo,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{incident_id}.pdf"},
    )


# ─── FALSE ALARM (Frontend button) ────────────────────────────────────────────
@app.post("/false-alarm")
def false_alarm(incident_id: Optional[str] = None):
    """Called when user clicks False Alarm button in UI."""
    # No logging — just return ack for frontend popup
    return {"status": "received", "message": "Thanks for your feedback. It will be used for future retraining of the model."}


# ─── TELEGRAM WEBHOOK (for inline button callbacks) ───────────────────────────
@app.post("/telegram-webhook")
async def telegram_webhook(request: Request):
    """
    Telegram sends POST here when user taps inline button.
    Set this URL in Telegram via:
    https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-render-url/telegram-webhook
    """
    try:
        data = await request.json()
        callback = data.get("callback_query")
        if callback and callback.get("data") == "false_alarm":
            answer_false_alarm_callback(
                token=TELEGRAM_TOKEN,
                callback_query_id=callback["id"],
                message_id=callback["message"]["message_id"],
                chat_id=str(callback["message"]["chat"]["id"]),
            )
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}