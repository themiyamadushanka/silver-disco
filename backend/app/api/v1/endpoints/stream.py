from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ai_chat import ai_chat_handler
from app.services.session_store import save_tracking_session_in_python

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

router = APIRouter()


@router.websocket("/hand-stream")
async def websocket_hand_stream(websocket: WebSocket):
    """
    Receives live 3D hand coordinates from the Next.js frontend,
    prints live finger positions to the terminal, and on SESSION_PAUSE / SESSION_END,
    analyzes all recorded positions and generates a meaningful sentence via AI.
    """
    await websocket.accept()
    print("\n" + "=" * 75)
    print("🟢 [LIVE HAND TRACKER CONNECTED] Streaming session started...")
    print("=" * 75 + "\n")

    session_frames = []

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            # Check if this message signals the user clicked PAUSE / END
            if action in ["SESSION_PAUSE", "SESSION_END"]:
                print("\n" + "-" * 75)
                print("⏸️ [PAUSE TRIGGER RECEIVED] User paused camera - saving to Python list and analyzing...")
                print("-" * 75)

                # Save all tracked finger positions into the Python list
                save_tracking_session_in_python(session_frames)

                result = ai_chat_handler.process_session(session_frames)

                # Send AI result back to frontend
                await websocket.send_json({
                    "type": "AI_ANALYSIS_RESULT",
                    "payload": result
                })

                # Clear session for next recording run
                session_frames.clear()
                continue

            # Regular frame: record into active session buffer
            session_frames.append(data)

            wrist = data.get("wrist") or {}
            fingers = data.get("fingers") or {}
            gesture = data.get("gesture") or {}
            metrics = data.get("metrics") or {}
            handedness = data.get("handedness", "Right")

            thumb = fingers.get("thumb", {}).get("tip", {})
            index = fingers.get("index", {}).get("tip", {})
            middle = fingers.get("middle", {}).get("tip", {})
            ring = fingers.get("ring", {}).get("tip", {})
            pinky = fingers.get("pinky", {}).get("tip", {})

            t_stat = "EXT" if fingers.get("thumb", {}).get("extended") else "FOLD"
            i_stat = "EXT" if fingers.get("index", {}).get("extended") else "FOLD"
            m_stat = "EXT" if fingers.get("middle", {}).get("extended") else "FOLD"
            r_stat = "EXT" if fingers.get("ring", {}).get("extended") else "FOLD"
            p_stat = "EXT" if fingers.get("pinky", {}).get("extended") else "FOLD"

            gesture_label = gesture.get("label", "Tracking")
            pinch = metrics.get("pinchThumbIndex", 0)

            # Print single-line live terminal updates during active stream
            print(
                f"\r🖐️ [{handedness[:1]}] "
                f"W:({wrist.get('x',0):.2f},{wrist.get('y',0):.2f}) "
                f"T:[{t_stat}] I:[{i_stat}] M:[{m_stat}] R:[{r_stat}] P:[{p_stat}] "
                f"Pinch:{pinch:>2}% Sign:{gesture_label:<18} (Frames: {len(session_frames)})",
                end="",
                flush=True
            )

    except WebSocketDisconnect:
        if session_frames:
            print("\n\n🔌 [DISCONNECTED: Processing final frames before exit...]")
            ai_chat_handler.process_session(session_frames)
        print("\n🔴 [TERMINAL STREAM CLOSED]\n")
