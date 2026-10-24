from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API powering the Next.js frontend starter application."
)

# Configure Cross-Origin Resource Sharing (CORS) for frontend client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Root"])
def root():
    """Root endpoint welcoming visitors and linking to interactive docs."""
    return {
        "message": "Welcome to FastAPI Backend API!",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1_health": f"{settings.API_V1_PREFIX}/health",
        "api_v1_items": f"{settings.API_V1_PREFIX}/items"
    }
