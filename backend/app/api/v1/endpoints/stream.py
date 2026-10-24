from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import re

router = APIRouter()

def strip_emojis(text: str) -> str:
    if not text:
        return ""
    clean = re.sub(r'[\U00010000-\U0010ffff\u2600-\u27bf\ufe00-\ufe0f]', '', str(text))
    return re.sub(r'\s+', ' ', clean).strip()

def pad(s: str, width: int, align: str = "left") -> str:
    s = str(s or "")
    if len(s) >= width:
        return s[:width]
    if align == "center":
        left = (width - len(s)) // 2
        return " " * left + s + " " * (width - len(s) - left)
    elif align == "right":
        return " " * (width - len(s)) + s
    return s + " " * (width - len(s))

def format_coord(val) -> str:
    if not isinstance(val, (int, float)):
        return " 0.000"
    prefix = " " if val >= 0 else ""
    return f"{prefix}{val:.3f}"

def format_coords(pt) -> str:
    if not pt or not isinstance(pt, dict) or "x" not in pt:
        return "      -- Not Detected --     "
    return f"X={format_coord(pt.get('x'))}  Y={format_coord(pt.get('y'))}  Z={format_coord(pt.get('z'))}"

def resolve_hands(hands):
    if not hands or not isinstance(hands, list):
        return None, None

    if len(hands) == 1:
        h = hands[0]
        h_handedness = str(h.get("handedness", "")).lower()
        if "left" in h_handedness:
            return h, None
        if "right" in h_handedness:
            return None, h
        x = (h.get("wrist") or {}).get("x", 0.5)
        return (h, None) if x < 0.5 else (None, h)

    h1 = hands[0]
    h2 = hands[1]

    h1_is_left = "left" in str(h1.get("handedness", "")).lower()
    h2_is_left = "left" in str(h2.get("handedness", "")).lower()
    h1_is_right = "right" in str(h1.get("handedness", "")).lower()
    h2_is_right = "right" in str(h2.get("handedness", "")).lower()

    if h1_is_left and h2_is_right:
        return h1, h2
    if h1_is_right and h2_is_left:
        return h2, h1

    h1_x = (h1.get("wrist") or {}).get("x", 0.5)
    h2_x = (h2.get("wrist") or {}).get("x", 0.5)
    return (h1, h2) if h1_x <= h2_x else (h2, h1)

def build_table(left_hand, right_hand, global_gesture):
    col_w = [16, 30, 7, 30, 7]
    sep = "+" + "+".join(["-" * (w + 2) for w in col_w]) + "+"

    def row(c1, c2, c3, c4, c5):
        return f"| {pad(c1, col_w[0])} | {pad(c2, col_w[1])} | {pad(c3, col_w[2], 'center')} | {pad(c4, col_w[3])} | {pad(c5, col_w[4], 'center')} |"

    left_title = "LEFT HAND (X, Y, Z)" if left_hand else "LEFT HAND (Inactive)"
    right_title = "RIGHT HAND (X, Y, Z)" if right_hand else "RIGHT HAND (Inactive)"

    lines = [
        sep,
        row("JOINT / METRIC", left_title, "STATE", right_title, "STATE"),
        sep,
        row(
            "Wrist (Root)",
            format_coords((left_hand or {}).get("wrist")),
            "--",
            format_coords((right_hand or {}).get("wrist")),
            "--",
        ),
    ]

    finger_names = ["thumb", "index", "middle", "ring", "pinky"]
    for finger_name in finger_names:
        lf = ((left_hand or {}).get("fingers") or {}).get(finger_name)
        rf = ((right_hand or {}).get("fingers") or {}).get(finger_name)
        label = f"{finger_name.capitalize()} Tip"

        l_coords = format_coords((lf or {}).get("tip"))
        l_state = ("EXT" if lf.get("extended") else "FOLD") if lf else "--"

        r_coords = format_coords((rf or {}).get("tip"))
        r_state = ("EXT" if rf.get("extended") else "FOLD") if rf else "--"

        lines.append(row(label, l_coords, l_state, r_coords, r_state))

    lines.append(sep)

    # Gesture row
    l_gesture = (left_hand or {}).get("gesture") or (global_gesture if left_hand and not right_hand else None)
    r_gesture = (right_hand or {}).get("gesture") or (global_gesture if not left_hand and right_hand else None)

    l_sign = strip_emojis(l_gesture.get("label") or l_gesture.get("gesture") or "Tracking") if l_gesture else "--"
    l_conf = f"[{l_gesture.get('confidence', 0)}%]" if l_gesture and l_gesture.get("confidence") else "--"

    r_sign = strip_emojis(r_gesture.get("label") or r_gesture.get("gesture") or "Tracking") if r_gesture else "--"
    r_conf = f"[{r_gesture.get('confidence', 0)}%]" if r_gesture and r_gesture.get("confidence") else "--"

    lines.append(row("Detected Sign", l_sign, l_conf, r_sign, r_conf))

    # Pinch & Span row
    l_metrics = (left_hand or {}).get("metrics")
    r_metrics = (right_hand or {}).get("metrics")

    l_pinch = f"Pinch: {l_metrics.get('pinchThumbIndex', 0)}%  Span: {l_metrics.get('palmSpan', 0)}%" if l_metrics else "--"
    l_pinch_state = ("PINCH" if l_metrics.get("isPinching") else "OPEN") if l_metrics else "--"

    r_pinch = f"Pinch: {r_metrics.get('pinchThumbIndex', 0)}%  Span: {r_metrics.get('palmSpan', 0)}%" if r_metrics else "--"
    r_pinch_state = ("PINCH" if r_metrics.get("isPinching") else "OPEN") if r_metrics else "--"

    lines.append(row("Pinch & Span", l_pinch, l_pinch_state, r_pinch, r_pinch_state))

    # Extended count row
    l_ext = f"{l_metrics.get('extendedCount', 0)} / 5 Extended" if l_metrics else "--"
    r_ext = f"{r_metrics.get('extendedCount', 0)} / 5 Extended" if r_metrics else "--"

    lines.append(row("Extended Count", l_ext, "", r_ext, ""))
    lines.append(sep)

    return "\n".join(lines)


@router.websocket("/hand-stream")
async def websocket_hand_stream(websocket: WebSocket):
    """
    Receives live 3D hand coordinates from the Next.js frontend
    and prints BOTH hands in a unified side-by-side terminal table in real-time.
    """
    await websocket.accept()
    print("\n" + "=" * 101)
    print("🟢 [LIVE HAND TRACKER CONNECTED] Printing BOTH hands reading in unified table...")
    print("=" * 101 + "\n")
    try:
        while True:
            data = await websocket.receive_json()
            global_gesture = data.get("gesture") or {}
            hands = data.get("hands")
            if not isinstance(hands, list):
                hands = [data]

            left_hand, right_hand = resolve_hands(hands)
            print("\n" + build_table(left_hand, right_hand, global_gesture))

    except WebSocketDisconnect:
        print("\n\n🔴 [TERMINAL STREAM DISCONNECTED]\n")
