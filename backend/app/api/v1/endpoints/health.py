from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()

@router.get("", response_model=HealthResponse)
def get_health():
    """Health check endpoint to verify backend status."""
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        service=settings.PROJECT_NAME
    )
