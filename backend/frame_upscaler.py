"""
FSRCNN-based upscaling via OpenCV DNN.
Falls back to Lanczos if model not found.
Input:  list of RGB uint8 numpy arrays
Output: list of upscaled RGB uint8 numpy arrays
"""
import os
import cv2
import numpy as np

FSRCNN_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fsrcnn_x2.pb")
SCALE = 2

_sr = None

def _load_sr():
    global _sr
    if _sr is not None:
        return _sr
    if os.path.exists(FSRCNN_PATH):
        try:
            sr = cv2.dnn_superres.DnnSuperResImpl_create()
            sr.readModel(FSRCNN_PATH)
            sr.setModel("fsrcnn", SCALE)
            _sr = sr
            return _sr
        except Exception as e:
            print(f"[FSRCNN] Load failed: {e}. Falling back to Lanczos.")
    return None


def upscale_frame(frame_rgb: np.ndarray) -> np.ndarray:
    """
    Upscale single RGB frame.
    Returns upscaled RGB frame.
    """
    sr = _load_sr()
    if sr is not None:
        try:
            bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
            upscaled_bgr = sr.upsample(bgr)
            return cv2.cvtColor(upscaled_bgr, cv2.COLOR_BGR2RGB)
        except Exception as e:
            print(f"[FSRCNN] Upscale failed: {e}. Falling back to Lanczos.")

    # Lanczos fallback
    h, w = frame_rgb.shape[:2]
    pil_like = cv2.resize(frame_rgb, (w * SCALE, h * SCALE), interpolation=cv2.INTER_LANCZOS4)
    return pil_like


def upscale_frames(frames_rgb: list) -> list:
    """Upscale list of RGB frames."""
    return [upscale_frame(f) for f in frames_rgb]