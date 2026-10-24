import os
import json
import time
from typing import List, Dict, Any

# In-memory Python list storing all tracked finger positions from play to end
saved_finger_tracking_list: List[Dict[str, Any]] = []
session_history: List[Dict[str, Any]] = []

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

def save_tracking_session_in_python(frames: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Saves the complete sequence of finger and hand positions recorded
    between Play and Pause into a Python list and writes to disk.
    """
    global saved_finger_tracking_list, session_history

    # Store directly in Python list
    saved_finger_tracking_list = list(frames)

    session_id = f"session_{int(time.time())}"
    session_data = {
        "session_id": session_id,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_frames": len(saved_finger_tracking_list),
        "finger_positions": saved_finger_tracking_list,
    }

    session_history.append({
        "session_id": session_id,
        "count": len(saved_finger_tracking_list),
        "time": session_data["timestamp"],
    })

    # Save to disk as latest_hand_tracking.json
    latest_file_path = os.path.join(DATA_DIR, "latest_hand_tracking.json")
    try:
        with open(latest_file_path, "w", encoding="utf-8") as f:
            json.dump(session_data, f, indent=2)
    except Exception as e:
        print(f"⚠️ [Disk Save Warning]: {e}")

    # Print confirmation in the Python terminal
    print("\n" + "=" * 80)
    print("💾 [PYTHON LIST SAVED: ALL TRACKED FINGER POSITIONS STORED IN PYTHON]")
    print("=" * 80)
    print(f"• Python Variable:   saved_finger_tracking_list (Type: list, Length: {len(saved_finger_tracking_list)})")
    print(f"• Session ID:        {session_id}")
    print(f"• Persistent File:   {latest_file_path}")

    if saved_finger_tracking_list:
        first = saved_finger_tracking_list[0]
        last = saved_finger_tracking_list[-1]
        print(f"• First Snapshot:    Wrist={first.get('wrist')} | Extended={first.get('metrics', {}).get('extendedCount')}/5")
        print(f"• Last Snapshot:     Wrist={last.get('wrist')} | Extended={last.get('metrics', {}).get('extendedCount')}/5")

    print("=" * 80 + "\n")

    return session_data

def get_current_python_tracking_list() -> List[Dict[str, Any]]:
    """Returns the active in-memory Python list."""
    return saved_finger_tracking_list
