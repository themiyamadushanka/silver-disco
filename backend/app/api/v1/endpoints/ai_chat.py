from fastapi import APIRouter, HTTPException
from app.schemas.ai import HandSessionRequest, HandSessionResponse
from app.services.ai_chat import ai_chat_handler
from app.services.session_store import save_tracking_session_in_python, get_current_python_tracking_list

router = APIRouter()

@router.post("/analyze-session", response_model=HandSessionResponse)
def analyze_hand_session(request: HandSessionRequest):
    """
    Receives all recorded hand positions from play to pause,
    saves them into a Python list, writes to latest_hand_tracking.json,
    prints confirmation in the Python terminal, and generates an AI sentence via Azure AI Foundry.
    """
    try:
        frames_data = [f if isinstance(f, dict) else f.model_dump() for f in request.frames]

        # 1. Save all tracking frames directly into Python list
        save_tracking_session_in_python(frames_data)

        # 2. Process the Python list with Azure AI Foundry (gpt-5-mini)
        result = ai_chat_handler.process_session(frames_data)
        return HandSessionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI session processing failed: {str(e)}")

@router.get("/get-python-list")
def get_python_list():
    """
    Returns the currently stored Python list of finger tracking positions.
    """
    current_list = get_current_python_tracking_list()
    return {
        "stored_in_python": True,
        "total_items": len(current_list),
        "finger_positions_list": current_list
    }

@router.get("/status")
def get_ai_status():
    """
    Checks configuration status for Azure AI Foundry and OpenAI ChatGPT.
    """
    has_azure = bool(ai_chat_handler.azure_endpoint and ai_chat_handler.azure_api_key)
    has_openai = bool(ai_chat_handler.openai_api_key)

    return {
        "status": "ready",
        "azure_foundry_configured": has_azure,
        "azure_deployment": ai_chat_handler.azure_deployment if has_azure else None,
        "openai_configured": has_openai,
        "openai_model": ai_chat_handler.openai_model if has_openai else None,
        "python_list_store": "active",
    }
