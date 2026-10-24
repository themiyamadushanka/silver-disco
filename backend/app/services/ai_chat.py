import os
import sys
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any
from app.services.landmark_classifier import landmark_classifier

# Ensure Windows terminal doesn't crash on emoji characters

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


class AIChatHandler:
    def __init__(self):
        # Azure AI Foundry / Azure OpenAI configuration
        self.azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
        self.azure_api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        self.azure_deployment = os.getenv("AZURE_DEPLOYMENT_NAME", "gpt-5-mini")

        # Standard OpenAI fallback
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # -----------------------------------------------------------------
    # FINGER STATE HUMANIZER
    # Converts raw finger data into readable descriptions for the AI
    # -----------------------------------------------------------------

    def describe_finger_state(self, fingers: dict, metrics: dict) -> str:
        """Convert finger extension booleans into a natural language description."""
        parts = []
        for name in ["thumb", "index", "middle", "ring", "pinky"]:
            f = fingers.get(name) or {}
            state = "EXTENDED" if f.get("extended") else "CURLED"
            parts.append(f"{name}={state}")
        pinch = metrics.get("pinchThumbIndex", 0)
        open_count = metrics.get("extendedCount", 0)
        pinch_note = f"pinch={pinch}% (TIGHT)" if pinch < 7 else f"pinch={pinch}%"
        return f"[{', '.join(parts)}, {pinch_note}, open_fingers={open_count}/5]"

    def describe_gesture(self, gesture: dict) -> str:
        """Return the gesture label if known."""
        if not gesture:
            return "unknown"
        label = gesture.get("label", "")
        key = gesture.get("gesture", "")
        if key and key not in ("Unknown", "TRACKING", ""):
            return label or key
        return "transitioning"

    def analyze_session_frames(self, frames: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes the complete sequence of finger positions.
        Returns stable sign sequence, gesture timeline, and metrics.
        Lowered threshold to require only 2 frames for better sensitivity.
        """
        if not frames:
            return {
                "total_frames": 0,
                "detected_signs": [],
                "handedness": "Right",
                "max_pinch": 0,
                "wrist_avg": {"x": 0.0, "y": 0.0, "z": 0.0},
            }

        handedness = frames[0].get("handedness", "Right")
        max_pinch = 0
        total_wx, total_wy, total_wz = 0.0, 0.0, 0.0

        raw_csv_signs = []
        for f in frames:
            # Classify 3D landmarks against CSV dataset (supports dual hands & single hand)
            raw_lms = f.get("raw_landmarks") or f.get("landmarks")
            left_lms = f.get("left_landmarks")
            right_lms = f.get("right_landmarks")
            if (raw_lms and len(raw_lms) >= 21) or left_lms or right_lms:
                csv_pred = landmark_classifier.classify(
                    landmarks=raw_lms,
                    left_landmarks=left_lms,
                    right_landmarks=right_lms,
                    handedness=f.get("handedness", handedness)
                )
                if csv_pred.get("label") not in (None, "", "Unknown", "Invalid"):
                    raw_csv_signs.append(csv_pred["label"])

            metrics = f.get("metrics") or {}
            pinch = metrics.get("pinchThumbIndex", 0)
            if pinch > max_pinch:
                max_pinch = pinch

            wrist = f.get("wrist") or {}
            total_wx += wrist.get("x", 0.0)
            total_wy += wrist.get("y", 0.0)
            total_wz += wrist.get("z", 0.0)

        csv_unique_signs = []
        seen_csv = set()
        for sign in raw_csv_signs:
            if sign not in seen_csv:
                csv_unique_signs.append(sign)
                seen_csv.add(sign)

        frame_count = len(frames)
        wrist_avg = {
            "x": round(total_wx / frame_count, 3) if frame_count else 0.0,
            "y": round(total_wy / frame_count, 3) if frame_count else 0.0,
            "z": round(total_wz / frame_count, 3) if frame_count else 0.0,
        }

        return {
            "total_frames": frame_count,
            "detected_signs": csv_unique_signs,
            "csv_classified_signs": csv_unique_signs,
            "handedness": handedness,
            "max_pinch": max_pinch,
            "wrist_avg": wrist_avg,
        }

    def build_readable_trajectory(self, frames: List[Dict[str, Any]]) -> str:
        """
        Converts the list of frame dicts into a human-readable description
        of what the mute person's hand was doing frame by frame.
        """
        if not frames:
            return "(No frames recorded)"

        # Sample up to 12 key frames
        sampled = frames
        if len(frames) > 12:
            step = max(1, len(frames) // 12)
            sampled = frames[::step][:12]

        lines = []
        prev_gesture = None
        for idx, item in enumerate(sampled):
            fingers = item.get("fingers") or {}
            metrics = item.get("metrics") or {}
            gesture = item.get("gesture") or {}
            time_ms = item.get("time_ms", idx * 80)

            gesture_name = self.describe_gesture(gesture)
            finger_desc = self.describe_finger_state(fingers, metrics)

            # Check CSV classifier for this frame with dual-hand or single-hand landmarks
            raw_lms = item.get("raw_landmarks") or item.get("landmarks")
            left_lms = item.get("left_landmarks")
            right_lms = item.get("right_landmarks")
            csv_tag = ""
            if (raw_lms and len(raw_lms) >= 21) or left_lms or right_lms:
                csv_res = landmark_classifier.classify(
                    landmarks=raw_lms,
                    left_landmarks=left_lms,
                    right_landmarks=right_lms,
                    handedness=item.get("handedness", "Right")
                )
                if csv_res.get("label") not in (None, "", "Unknown", "Invalid"):
                    desc = f": {csv_res.get('description', '')}" if csv_res.get('description') else ""
                    csv_tag = f"  [CSV_Sign='{csv_res['label']}' {csv_res['confidence']}%{desc}]"

            line = f"  Frame {idx+1} (~{time_ms}ms): Sign='{gesture_name}'  Fingers={finger_desc}{csv_tag}"
            if gesture_name != prev_gesture and gesture_name not in ("unknown", "transitioning"):
                line += "  [NEW SIGN DETECTED]"
            prev_gesture = gesture_name
            lines.append(line)

        return "\n".join(lines)

    def print_terminal_analysis(self, analysis: Dict[str, Any], generated_sentence: str, source: str):
        """
        Prints the complete session analysis and generated sentence to the backend terminal.
        """
        csv_signs = analysis.get("csv_classified_signs") or []
        csv_str = " -> ".join(csv_signs) if csv_signs else "No CSV keyword detected"
        wrist = analysis.get("wrist_avg", {})
        ds_info = landmark_classifier.get_info()

        print("\n" + "=" * 80)
        print(f"[SESSION COMPLETE] CSV SIGN LANGUAGE DATASET ENGINE ({ds_info['filename']})")
        print("=" * 80)
        print(f"  Dataset Loaded         : {ds_info['filename']} ({ds_info['total_samples']} samples, {ds_info['total_labels']} signs)")
        print(f"  Total Frames Recorded  : {analysis.get('total_frames')}")
        print(f"  Hand Used              : {analysis.get('handedness')} Hand")
        print(f"  Peak Pinch             : {analysis.get('max_pinch')}%")
        print(f"  Avg Wrist Position     : X={wrist.get('x')}  Y={wrist.get('y')}  Z={wrist.get('z')}")
        print(f"  CSV Keyword Sequence   : {csv_str}")
        print("-" * 80)
        print(f"[AI ENGINE: {source.upper()}] Speaking as mute person in first person...")
        print("-" * 80)
        print(f"[FINAL SENTENCE FROM AI]:\n")
        print(f'   "{generated_sentence}"\n')
        print("=" * 80 + "\n")

    # -----------------------------------------------------------------
    # AZURE AI FOUNDRY CALL
    # -----------------------------------------------------------------

    def call_azure_ai_foundry(self, system_prompt: str, user_prompt: str) -> str:
        """
        Calls Azure AI Foundry / Azure OpenAI endpoint.
        Uses OpenAI v1 endpoint format (verified working).
        """
        if not self.azure_endpoint or not self.azure_api_key:
            return None

        if self.azure_endpoint.endswith("/openai/v1"):
            url = f"{self.azure_endpoint}/chat/completions"
        elif "inference.ai.azure.com" in self.azure_endpoint:
            url = f"{self.azure_endpoint}/v1/chat/completions"
        else:
            url = f"{self.azure_endpoint.rstrip('/')}/openai/v1/chat/completions"

        headers = {
            "Content-Type": "application/json",
            "api-key": self.azure_api_key,
            "Authorization": f"Bearer {self.azure_api_key}",
        }

        # NOTE: gpt-5-mini does not support temperature/max_tokens — omit them
        payload = {
            "model": self.azure_deployment,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"].strip().strip('"')

    def call_openai_api(self, system_prompt: str, user_prompt: str) -> str:
        """Calls standard OpenAI API as fallback."""
        if not self.openai_api_key:
            return None

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.openai_api_key}",
        }
        payload = {
            "model": self.openai_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"].strip().strip('"')

    # -----------------------------------------------------------------
    # MAIN PROCESS PIPELINE
    # -----------------------------------------------------------------

    def process_session(self, frames: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Main pipeline:
        1. Analyze the Python list of all recorded finger positions
        2. Keep only CSV dataset keywords for the AI
        3. Query Azure AI Foundry gpt-5-mini with expert sign language context
        4. Print the full sentence result to the Python terminal
        """
        analysis = self.analyze_session_frames(frames)
        signs = analysis.get("detected_signs") or []

        # Compose expert system + user prompt
        system_prompt = (
            "You are a professional ASL (American Sign Language) interpreter for a mute person. "
            "You receive only sign-language keywords classified by an ASL CSV dataset. "
            "Your job is to determine the message the mute person is communicating and speak it as their voice in the first person. "
            "\n\nKEY RULES:"
            "\n- Speak as if YOU ARE the mute person (e.g. 'Hello! How are you?', 'Yes, I agree.', 'Could you help me please?')"
            "\n- NEVER describe physical actions ('The user waves...', 'The hand shows...')"
            "\n- NEVER say 'The user is performing...' or 'The gesture indicates...'"
            "\n- Produce ONE natural, fluent English sentence or two short sentences maximum"
            "\n- If the sign sequence suggests a greeting → say a greeting"
            "\n- If signs show agreement → express agreement"
            "\n- If signs show a request → phrase it as a polite request"
            "\n- Use only the CSV dataset keywords as clues for meaning"
            "\n- Output ONLY the spoken sentence, no labels, no quotes, no explanation"
        )

        csv_signs = analysis.get("csv_classified_signs") or []

        if csv_signs:
            user_prompt = (
                f"CSV sign-language keywords detected in sequence: {', '.join(csv_signs)}\n"
                "Speak the mute person's words in first person. "
                "Output ONLY their spoken sentence."
            )
        else:
            user_prompt = (
                "No CSV sign-language keyword was detected. Ask the mute person to repeat the sign. "
                "Output ONLY their spoken sentence."
            )

        source = "Azure AI Foundry"
        sentence = None

        # 1. Try Azure AI Foundry (gpt-5-mini)
        if self.azure_endpoint and self.azure_api_key:
            try:
                sentence = self.call_azure_ai_foundry(system_prompt, user_prompt)
                if sentence:
                    source = f"Azure AI Foundry ({self.azure_deployment})"
            except Exception as e:
                print(f"[Azure AI Error]: {e}")

        # 2. Try standard OpenAI as fallback
        if not sentence and self.openai_api_key:
            try:
                sentence = self.call_openai_api(system_prompt, user_prompt)
                if sentence:
                    source = f"OpenAI ({self.openai_model})"
            except Exception as e:
                print(f"[OpenAI Error]: {e}")

        primary_signs = csv_signs

        # Zero-default rule: report actual failure if AI unreachable
        if not sentence:
            if primary_signs:
                sentence = f"({', '.join(primary_signs)})"
            else:
                sentence = "(No CSV sign keyword detected — AI unavailable)"

        # Print full result to the Python terminal
        self.print_terminal_analysis(analysis, sentence, source)

        return {
            "success": True,
            "total_frames": analysis.get("total_frames"),
            "detected_signs": primary_signs,
            "meaningful_sentence": sentence,
            "analysis_summary": f"Classified with CSV dataset ({landmark_classifier.get_info()['filename']}): {', '.join(primary_signs) if primary_signs else 'movement'}",
            "source": source,
        }


ai_chat_handler = AIChatHandler()
