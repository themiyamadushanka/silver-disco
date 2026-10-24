import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from app.services.landmark_classifier import landmark_classifier
from app.schemas.dataset import (
    RecordSampleRequest,
    RecordSampleResponse,
    ClassifyFrameRequest,
    ClassifyFrameResponse,
    DatasetInfoResponse
)

router = APIRouter()

@router.get("/info", response_model=DatasetInfoResponse)
def get_dataset_info():
    """
    Returns information about the loaded CSV dataset:
    Total samples, total unique signs, label distribution, file path.
    """
    return landmark_classifier.get_info()

@router.post("/record-sample", response_model=RecordSampleResponse)
def record_sample(request: RecordSampleRequest):
    """
    Records a live 21-landmark hand snapshot directly into the CSV dataset file.
    Automatically normalizes landmarks relative to wrist and palm scale.
    """
    if not request.label or not request.label.strip():
        raise HTTPException(status_code=400, detail="Label cannot be empty.")

    clean_label = request.label.strip().upper().replace(" ", "_")

    if len(request.landmarks) < 21 and len(request.landmarks) != 63:
        raise HTTPException(
            status_code=400,
            detail=f"Expected 21 landmark points or 63 floats, received {len(request.landmarks)}"
        )

    try:
        landmark_classifier.add_sample(clean_label, request.landmarks, append_to_file=True)
        return RecordSampleResponse(
            success=True,
            label=clean_label,
            total_samples=len(landmark_classifier.dataset),
            message=f"Successfully recorded 1 sample for sign '{clean_label}' into CSV dataset."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record sample: {str(e)}")

@router.post("/classify-frame", response_model=ClassifyFrameResponse)
def classify_frame(request: ClassifyFrameRequest):
    """
    Classifies a hand snapshot against the CSV dataset using Euclidean distance.
    Supports single hand (landmarks) and dual hands (left_landmarks & right_landmarks).
    """
    result = landmark_classifier.classify(
        landmarks=request.landmarks,
        left_landmarks=request.left_landmarks,
        right_landmarks=request.right_landmarks,
        handedness=request.handedness or "Right"
    )
    return ClassifyFrameResponse(**result)

@router.get("/download-csv")
def download_csv():
    """
    Returns the full CSV dataset as a downloadable file.
    """
    if not os.path.exists(landmark_classifier.csv_path):
        raise HTTPException(status_code=404, detail="Dataset CSV file not found.")
    filename = os.path.basename(landmark_classifier.csv_path)
    return FileResponse(
        path=landmark_classifier.csv_path,
        media_type="text/csv",
        filename=filename
    )

@router.get("/view-csv-preview", response_class=PlainTextResponse)
def view_csv_preview(max_lines: int = 15):
    """
    Returns the top lines of the CSV file as raw text for quick inspection.
    """
    if not os.path.exists(landmark_classifier.csv_path):
        raise HTTPException(status_code=404, detail="Dataset CSV file not found.")

    with open(landmark_classifier.csv_path, "r", encoding="utf-8") as f:
        lines = [f.readline() for _ in range(max_lines)]
    return "".join(lines)
