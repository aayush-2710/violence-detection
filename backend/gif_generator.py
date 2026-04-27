"""
GIF generation from violent frames.
All in-memory — nothing written to disk.
"""
import io
import numpy as np
from PIL import Image


def generate_gif(
    frames_rgb: list,
    frame_duration_ms: int = 120,
    max_width: int = 480,
    max_frames: int = 10,
) -> bytes:
    """
    Args:
        frames_rgb: list of RGB uint8 numpy arrays
        frame_duration_ms: ms per frame
        max_width: max GIF width (height auto-scaled)
        max_frames: cap frames to keep size ≤ 5MB

    Returns: GIF as bytes
    """
    if not frames_rgb:
        raise ValueError("No frames provided for GIF generation.")

    selected = frames_rgb[:max_frames]

    pil_frames = []
    for f in selected:
        img = Image.fromarray(f.astype(np.uint8), mode="RGB")
        # Resize if wider than max_width
        w, h = img.size
        if w > max_width:
            ratio = max_width / w
            img = img.resize((max_width, int(h * ratio)), Image.LANCZOS)
        pil_frames.append(img)

    # Quantize for smaller GIF
    palette_frames = [
        f.convert("RGB").quantize(colors=128, method=Image.Quantize.MEDIANCUT)
        for f in pil_frames
    ]

    buf = io.BytesIO()
    palette_frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=palette_frames[1:],
        duration=frame_duration_ms,
        loop=0,
        optimize=True,
    )
    buf.seek(0)
    raw = buf.read()

    # If > 5MB, retry with reduced frames
    if len(raw) > 5 * 1024 * 1024 and len(selected) > 4:
        return generate_gif(frames_rgb, frame_duration_ms, max_width, max_frames=max_frames // 2)

    return raw