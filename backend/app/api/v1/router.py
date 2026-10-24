from fastapi import APIRouter
from app.api.v1.endpoints import health, items

api_router = APIRouter()

# Include feature endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])
