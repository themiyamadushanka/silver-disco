from typing import List
import os

class Settings:
    PROJECT_NAME: str = "FastAPI + Next.js Starter"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Allowed CORS origins for frontend communication
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
