"""
Core ML inference module.
Smart frame sampling across full video duration.
Input shape: (1, 30, 128, 128, 3)
"""
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from typing import Optional

IMG_H = 128
IMG_W = 128
NUM_FRAMES = 30       # model sequence length
SAMPLE_POOL = 90      # frames to sample from video before picking 30
MAX_VIDEO_SECONDS = 180  # 3 minutes hard limit

CLASS_NAMES = ["Non-Violence", "Violence"]


@tf.keras.utils.register_keras_serializable()
def _placeholder():
    pass


def load_model(model_path: str):
    return tf.keras.models.load_model(model_path)


def get_video_metadata(video_path: str) -> dict:
    """Extract video metadata."""
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration_sec = total_frames / fps if fps > 0 else 0
    cap.release()
    return {
        "fps": round(fps, 2),
        "total_frames": total_frames,
        "width": width,
        "height": height,
        "duration_seconds": round(duration_sec, 2),
        "duration_str": f"{int(duration_sec // 60)}m {int(duration_sec % 60)}s",
    }


def validate_video_duration(video_path: str) -> tuple[bool, str]:
    """Returns (is_valid, error_message)."""
    meta = get_video_metadata(video_path)
    if meta["duration_seconds"] > MAX_VIDEO_SECONDS:
        mins = int(meta["duration_seconds"] // 60)
        secs = int(meta["duration_seconds"] % 60)
        return False, f"Video is {mins}m {secs}s — maximum allowed is 3 minutes."
    return True, ""


def smart_sample_frames(video_path: str) -> tuple[list, list, dict]:
    """
    Uniformly sample SAMPLE_POOL frames across full video duration.
    Then pick NUM_FRAMES uniformly from those for model input.

    Returns:
        raw_frames_rgb   : list of RGB uint8 arrays (SAMPLE_POOL frames, for display)
        model_frames     : list of preprocessed float32 arrays (NUM_FRAMES, for model)
        metadata         : video metadata dict
    """
    meta = get_video_metadata(video_path)
    total = meta["total_frames"]
    fps = meta["fps"]

    cap = cv2.VideoCapture(video_path)

    # Uniform indices across full video
    sample_indices = np.linspace(0, total - 1, SAMPLE_POOL, dtype=int)

    raw_frames_rgb = []
    for idx in sample_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if not ret:
            # Duplicate last frame if read fails
            if raw_frames_rgb:
                raw_frames_rgb.append(raw_frames_rgb[-1].copy())
            continue
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        raw_frames_rgb.append(rgb)

    cap.release()

    if len(raw_frames_rgb) < NUM_FRAMES:
        raise ValueError(f"Could not extract enough frames. Got {len(raw_frames_rgb)}, need {NUM_FRAMES}.")

    # Pick NUM_FRAMES from pool for model
    model_indices = np.linspace(0, len(raw_frames_rgb) - 1, NUM_FRAMES, dtype=int)
    model_frames_raw = [raw_frames_rgb[i] for i in model_indices]

    # Preprocess for model
    model_frames = []
    for f in model_frames_raw:
        resized = cv2.resize(f, (IMG_W, IMG_H))
        preprocessed = preprocess_input(resized.astype(np.float32))
        model_frames.append(preprocessed)

    return raw_frames_rgb, model_frames, meta


def predict(model, model_frames: list) -> dict:
    """
    Run inference.
    Returns prediction dict.
    """
    sequence = np.array(model_frames)                  # (30, 128, 128, 3)
    sequence = np.expand_dims(sequence, axis=0)        # (1, 30, 128, 128, 3)

    raw_pred = model.predict(sequence, verbose=0)[0]   # (2,)

    cls_idx = int(np.argmax(raw_pred))
    violence_conf = float(raw_pred[1]) * 100
    nonviolence_conf = float(raw_pred[0]) * 100
    is_violence = cls_idx == 1
    confidence = violence_conf if is_violence else nonviolence_conf

    severity = get_severity(violence_conf)

    return {
        "is_violence": is_violence,
        "class_name": CLASS_NAMES[cls_idx],
        "violence_confidence": round(violence_conf, 4),
        "nonviolence_confidence": round(nonviolence_conf, 4),
        "confidence": round(confidence, 4),
        "severity": severity,
        "threshold_used": 50.0,
        "model_input_shape": [1, NUM_FRAMES, IMG_H, IMG_W, 3],
        "backbone": "MobileNetV2",
        "architecture": "CNN + LSTM",
    }


def get_severity(violence_conf: float) -> dict:
    if violence_conf < 40:
        return {"level": "CLEAR", "color": "green", "code": 0}
    elif violence_conf < 60:
        return {"level": "SUSPICIOUS", "color": "yellow", "code": 1}
    elif violence_conf < 80:
        return {"level": "HIGH RISK", "color": "orange", "code": 2}
    else:
        return {"level": "CRITICAL", "color": "red", "code": 3}


def get_top_violent_frame_indices(raw_frames_rgb: list, model, n: int = 5) -> list:
    """
    Score each raw frame individually, return top-n indices by violence score.
    Used for keyframe selection + GIF generation.
    """
    scores = []
    for f in raw_frames_rgb:
        resized = cv2.resize(f, (IMG_W, IMG_H))
        arr = preprocess_input(resized.astype(np.float32))
        inp = np.expand_dims(arr, axis=0)          # (1, 128, 128, 3)
        # Wrap in sequence dim for LSTM models
        try:
            seq = np.expand_dims(inp, axis=0)      # (1, 1, 128, 128, 3)
            # Pad to NUM_FRAMES by repeating
            seq_padded = np.repeat(seq, NUM_FRAMES, axis=1)  # (1, 30, 128, 128, 3)
            p = model.predict(seq_padded, verbose=0)[0]
        except Exception:
            p = [0.5, 0.5]
        scores.append(float(p[1]))

    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return ranked[:n]