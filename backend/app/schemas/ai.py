from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class LandmarkPoint(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0

class FingerState(BaseModel):
    extended: bool = False
    tip: Optional[LandmarkPoint] = None

class SessionFrame(BaseModel):
    timestamp: Optional[float] = None
    wrist: Optional[LandmarkPoint] = None
    fingers: Optional[Dict[str, Any]] = None
    gesture: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    handedness: Optional[str] = "Right"

class HandSessionRequest(BaseModel):
    frames: List[Dict[str, Any]] = []
    session_id: Optional[str] = None
    duration_ms: Optional[float] = None

class HandSessionResponse(BaseModel):
    success: bool
    total_frames: int
    detected_signs: List[str]
    meaningful_sentence: str
    tone: Optional[str] = "Polite / Natural"
    analysis_summary: Optional[str] = None
    source: str = "azure_foundry_or_openai"
