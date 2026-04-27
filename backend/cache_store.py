"""
In-memory hash-based cache.
Key: MD5 hash of video bytes
Value: full result dict
"""
import hashlib
from typing import Optional

_cache: dict = {}

def compute_hash(video_bytes: bytes) -> str:
    return hashlib.md5(video_bytes).hexdigest()

def get_cached(video_hash: str) -> Optional[dict]:
    return _cache.get(video_hash)

def set_cache(video_hash: str, result: dict) -> None:
    _cache[video_hash] = result

def cache_size() -> int:
    return len(_cache)