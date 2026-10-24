from fastapi import APIRouter
from app.api.v1.endpoints import health, items, stream, ai_chat, dataset

api_router = APIRouter()

# Include feature endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])
api_router.include_router(stream.router, prefix="/ws", tags=["Stream"])
api_router.include_router(ai_chat.router, prefix="/ai", tags=["AI Chat"])
api_router.include_router(dataset.router, prefix="/dataset", tags=["Sign Dataset CSV"])



