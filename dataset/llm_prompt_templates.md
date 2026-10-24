# LLM Integration Guide: Sign Language 3D Coordinate Translation

This guide demonstrates how to feed 3D hand landmark coordinates (from MediaPipe and `sign_language_dual_hands_dataset.csv`) into Large Language Models (LLMs) such as **Google Gemini**, **OpenAI GPT-4o**, or **Claude 3.5 Sonnet** to perform robust zero-shot sign translation, gesture reasoning, and natural sentence generation.

---

## 1. Why Convert Raw Coordinates to Structured Semantics?

Sending 126 raw floating-point numbers (`0.4523, 0.6182, -0.0201...`) directly in an LLM prompt can be inefficient because:
1. **Token Consumption**: 126 floats cost ~200-400 tokens per single frame.
2. **Spatial Reasoning**: LLMs excel at natural language and spatial relationships (e.g. "Index extended", "Hands touching", "Fist with thumb up") rather than trigonometry calculations.

### The Recommended Hybrid Prompt Representation
We compress the 126 coordinates into a **Compact Spatial Token Format**:
- Relative hand positions (Left vs Right wrist distance).
- Finger status bitmasks (`EXT` vs `FOLD`).
- Pinch percentages.
- Orientation (palm facing direction).

---

## 2. Python Coordinate-to-LLM Prompt Formatter

Use this helper function to turn raw readings into an LLM-ready prompt:

```python
import math

def format_reading_for_llm(left_hand: dict, right_hand: dict) -> str:
    """
    Converts 3D coordinates into a token-efficient semantic prompt for LLMs.
    """
    lines = []
    
    # 1. Hand Presence
    has_left = bool(left_hand and left_hand.get("wrist"))
    has_right = bool(right_hand and right_hand.get("wrist"))
    
    if not has_left and not has_right:
        return "No hands detected in frame."

    # 2. Hand-to-Hand Spatial Relationship
    if has_left and has_right:
        lw = left_hand["wrist"]
        rw = right_hand["wrist"]
        dist = math.sqrt((lw['x'] - rw['x'])**2 + (lw['y'] - rw['y'])**2 + (lw['z'] - rw['z'])**2)
        rel_pos = "together" if dist < 0.12 else "separated"
        lines.append(f"INTERACTION: Two-handed gesture | Hands {rel_pos} (3D Distance: {dist:.2f})")
    elif has_right:
        lines.append("INTERACTION: Single-hand gesture (Right hand active)")
    else:
        lines.append("INTERACTION: Single-hand gesture (Left hand active)")

    # 3. Individual Hand Configurations
    for side, hand in [("Left Hand", left_hand), ("Right Hand", right_hand)]:
        if not hand or not hand.get("wrist"):
            lines.append(f"{side}: Inactive / Resting")
            continue
            
        fingers = hand.get("fingers", {})
        states = []
        for f in ["thumb", "index", "middle", "ring", "pinky"]:
            stat = "EXT" if fingers.get(f, {}).get("extended") else "FOLD"
            states.append(f"{f}:{stat}")
            
        pinch = hand.get("metrics", {}).get("pinchThumbIndex", 0)
        ext_count = hand.get("metrics", {}).get("extendedCount", 0)
        lines.append(
            f"{side}: [{', '.join(states)}] | Extended: {ext_count}/5 | Pinch: {pinch}%"
        )
        
    return "\n".join(lines)
```

---

## 3. Example LLM System Prompt

```markdown
You are SignBridge-LLM, an expert AI sign language interpreter and accessibility translator.
You receive 3D hand joint readings and biomechanical spatial states of deaf/mute individuals.

Your goals:
1. Identify the most probable sign language gesture (ASL / universal).
2. Infer the intended communication meaning.
3. Formulate a polite, natural spoken sentence that a voice synthesizer can speak aloud.

Format your response as strict JSON:
{
  "detected_sign": "HELP",
  "confidence": 0.95,
  "meaning": "Requesting immediate assistance",
  "spoken_phrase": "Could you please help me?"
}
```

---

## 4. Example Few-Shot Prompt & Expected Output

### Input Prompt:
```text
Reading from User:
INTERACTION: Two-handed gesture | Hands together (3D Distance: 0.08)
Left Hand: [thumb:EXT, index:EXT, middle:EXT, ring:EXT, pinky:EXT] | Extended: 5/5 | Pinch: 95% (Flat palm facing up)
Right Hand: [thumb:EXT, index:FOLD, middle:FOLD, ring:FOLD, pinky:FOLD] | Extended: 1/5 | Pinch: 0% (Fist with thumb up)
Right hand wrist is positioned directly on top of left hand palm.
```

### LLM Output:
```json
{
  "detected_sign": "HELP",
  "confidence": 0.98,
  "meaning": "Emergency or request for assistance (ASL: dominant fist on non-dominant flat palm)",
  "spoken_phrase": "I need help, please."
}
```
