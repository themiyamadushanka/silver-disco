from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class RecordSampleRequest(BaseModel):
    label: str
    landmarks: Optional[List[Any]] = None
    left_landmarks: Optional[List[Any]] = None
    right_landmarks: Optional[List[Any]] = None
    two_handed: Optional[bool] = False
    description: Optional[str] = None

class RecordSampleResponse(BaseModel):
    success: bool
    label: str
    total_samples: int
    message: str

class ClassifyFrameRequest(BaseModel):
    landmarks: Optional[List[Any]] = None
    left_landmarks: Optional[List[Any]] = None
    right_landmarks: Optional[List[Any]] = None
    handedness: Optional[str] = "Right"

class ClassifyFrameResponse(BaseModel):
    label: str
    category: Optional[str] = "General"
    confidence: float
    distance: float
    two_handed: Optional[bool] = False
    description: Optional[str] = ""
    llm_prompt_summary: Optional[str] = ""
    top_matches: List[Dict[str, Any]] = []

class DatasetInfoResponse(BaseModel):
    csv_path: str
    filename: str
    dataset_format: Optional[str] = "dual_hands_rich"
    total_samples: int
    total_labels: int
    labels: List[str]
    label_distribution: Dict[str, int]
    label_metadata: Optional[Dict[str, Any]] = {}
