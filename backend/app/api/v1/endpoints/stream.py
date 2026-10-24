from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket("/hand-stream")
async def websocket_hand_stream(websocket: WebSocket):
    """
    Receives live 3D hand coordinates from the Next.js frontend
    and prints ALL finger positions (Wrist, Thumb, Index, Middle, Ring, Pinky)
    directly to the terminal in real-time.
    """
    await websocket.accept()
    print("\n" + "=" * 75)
    print("🟢 [LIVE HAND TRACKER CONNECTED] Printing ALL finger positions to terminal...")
    print("=" * 75 + "\n")
    try:
        while True:
            data = await websocket.receive_json()
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

            print(
                f"\n🖐️ [{handedness.upper()} HAND] Sign: {gesture_label} | Pinch: {pinch}%\n"
                f"  • Wrist:  X={wrist.get('x', 0):.3f}  Y={wrist.get('y', 0):.3f}  Z={wrist.get('z', 0):.3f}\n"
                f"  • Thumb:  X={thumb.get('x', 0):.3f}  Y={thumb.get('y', 0):.3f}  Z={thumb.get('z', 0):.3f}  [{t_stat}]\n"
                f"  • Index:  X={index.get('x', 0):.3f}  Y={index.get('y', 0):.3f}  Z={index.get('z', 0):.3f}  [{i_stat}]\n"
                f"  • Middle: X={middle.get('x', 0):.3f}  Y={middle.get('y', 0):.3f}  Z={middle.get('z', 0):.3f}  [{m_stat}]\n"
                f"  • Ring:   X={ring.get('x', 0):.3f}  Y={ring.get('y', 0):.3f}  Z={ring.get('z', 0):.3f}  [{r_stat}]\n"
                f"  • Pinky:  X={pinky.get('x', 0):.3f}  Y={pinky.get('y', 0):.3f}  Z={pinky.get('z', 0):.3f}  [{p_stat}]\n"
                f"{'-'*75}"
            )

    except WebSocketDisconnect:
        print("\n\n🔴 [TERMINAL STREAM DISCONNECTED]\n")
