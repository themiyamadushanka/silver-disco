import os
import sys
import math
import csv
from typing import List, Dict, Any, Optional, Tuple

# Ensure stdout handles unicode/emoji on Windows
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BACKEND_DIR, "data")

# Preferred datasets in priority order
PRIMARY_CSV_PATH = os.path.join(DATA_DIR, "sign_language_dual_hands_dataset.csv")
ROOT_CSV_PATH = os.path.join(PROJECT_ROOT, "sign_language_dual_hands_dataset.csv")
FALLBACK_CSV_PATH = os.path.join(DATA_DIR, "sign_landmarks_example.csv")

MEDIA_PIPE_LANDMARK_NAMES = [
    "wrist",
    "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip",
    "index_mcp", "index_pip", "index_dip", "index_tip",
    "middle_mcp", "middle_pip", "middle_dip", "middle_tip",
    "ring_mcp", "ring_pip", "ring_dip", "ring_tip",
    "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip"
]


def normalize_21_landmarks(landmarks: List[Any]) -> List[float]:
    """
    Normalizes 21 3D hand landmarks:
    - Landmark 0 (wrist) becomes origin (0, 0, 0).
    - Scaled by distance between wrist (lm0) and middle finger MCP (lm9).
    Returns 63 normalized floats.
    """
    if len(landmarks) == 63 and isinstance(landmarks[0], (int, float)):
        return [float(v) for v in landmarks]

    if len(landmarks) < 21:
        raise ValueError(f"Expected at least 21 landmarks, received {len(landmarks)}")

    coords = []
    for lm in landmarks[:21]:
        if isinstance(lm, dict):
            coords.append((float(lm.get("x", 0.0)), float(lm.get("y", 0.0)), float(lm.get("z", 0.0))))
        elif isinstance(lm, (list, tuple)) and len(lm) >= 3:
            coords.append((float(lm[0]), float(lm[1]), float(lm[2])))
        else:
            coords.append((0.0, 0.0, 0.0))

    wx, wy, wz = coords[0]
    rel = [(x - wx, y - wy, z - wz) for x, y, z in coords]

    mx, my, mz = rel[9]
    scale = math.sqrt(mx * mx + my * my + mz * mz)
    if scale < 1e-4:
        scale = 1.0

    flat = []
    for x, y, z in rel:
        flat.extend([x / scale, y / scale, z / scale])
    return flat


def euclidean_distance(v1: List[float], v2: List[float]) -> float:
    """Computes average per-coordinate distance between two normalized vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 999.0
    d_sq = 0.0
    for a, b in zip(v1, v2):
        diff = a - b
        d_sq += diff * diff
    return math.sqrt(d_sq / len(v1))


class LandmarkClassifier:
    """
    Sign Language Landmark Classifier & CSV Dataset System.
    Loads and parses dual-hands and single-hand sign language datasets
    (including sign_language_dual_hands_dataset.csv with 300+ samples across 20 ASL signs).
    Performs scale- and position-invariant nearest-neighbor recognition.
    """

    def __init__(self, csv_path: Optional[str] = None):
        self.csv_path = self._resolve_dataset_path(csv_path)
        self.dataset_type = "unknown"
        self.samples: List[Dict[str, Any]] = []
        self.labels: List[str] = []
        self.label_info: Dict[str, Dict[str, Any]] = {}
        self.load_dataset()

    def _resolve_dataset_path(self, custom_path: Optional[str] = None) -> str:
        """Finds the best available CSV dataset file."""
        if custom_path and os.path.exists(custom_path):
            return custom_path
        if os.path.exists(PRIMARY_CSV_PATH):
            return PRIMARY_CSV_PATH
        if os.path.exists(ROOT_CSV_PATH):
            return ROOT_CSV_PATH
        if os.path.exists(FALLBACK_CSV_PATH):
            return FALLBACK_CSV_PATH
        return PRIMARY_CSV_PATH

    def load_dataset(self) -> int:
        """Loads and normalizes all sign prototypes from the CSV file."""
        self.samples = []
        self.labels = []
        self.label_info = {}

        if not os.path.exists(self.csv_path):
            print(f"[CSV Classifier] Dataset file not found at: {self.csv_path}")
            return 0

        try:
            with open(self.csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                fieldnames = reader.fieldnames or []

                # Detect if this is the dual-hands 300-sample dataset
                if "sign_name" in fieldnames and "right_wrist_x" in fieldnames:
                    self.dataset_type = "dual_hands_rich"
                    self._load_dual_hands_dataset(reader)
                elif "label" in fieldnames and "lm0_x" in fieldnames:
                    self.dataset_type = "single_hand_64col"
                    self._load_64col_dataset(reader)
                else:
                    self.dataset_type = "generic_csv"
                    self._load_generic_dataset(reader)

            self.labels = sorted(list(set(s["sign_name"] for s in self.samples)))
            print(
                f"[CSV Classifier] Successfully loaded {len(self.samples)} samples across "
                f"{len(self.labels)} signs from '{os.path.basename(self.csv_path)}' (format: {self.dataset_type})"
            )
            return len(self.samples)
        except Exception as e:
            print(f"[CSV Classifier] Error reading CSV dataset: {e}")
            return 0

    def _load_dual_hands_dataset(self, reader):
        """Loads sign_language_dual_hands_dataset.csv (300 rows, dual hands, descriptions)."""
        for row in reader:
            sign_name = row.get("sign_name", "").strip().upper()
            if not sign_name:
                continue

            two_handed = int(row.get("two_handed", "0") or "0")
            dominant = row.get("dominant_hand", "Right")
            left_present = int(row.get("left_present", "0") or "0")
            right_present = int(row.get("right_present", "0") or "0")
            desc = row.get("description", "")
            llm_summary = row.get("llm_prompt_summary", "")
            category = row.get("category", "General")

            # Store label metadata
            if sign_name not in self.label_info:
                self.label_info[sign_name] = {
                    "category": category,
                    "two_handed": bool(two_handed),
                    "dominant_hand": dominant,
                    "description": desc,
                    "llm_prompt_summary": llm_summary,
                }

            # Extract 21 points for right hand
            right_pts = []
            if right_present:
                for lm in MEDIA_PIPE_LANDMARK_NAMES:
                    x = float(row.get(f"right_{lm}_x", 0.0) or 0.0)
                    y = float(row.get(f"right_{lm}_y", 0.0) or 0.0)
                    z = float(row.get(f"right_{lm}_z", 0.0) or 0.0)
                    right_pts.append((x, y, z))

            # Extract 21 points for left hand
            left_pts = []
            if left_present:
                for lm in MEDIA_PIPE_LANDMARK_NAMES:
                    x = float(row.get(f"left_{lm}_x", 0.0) or 0.0)
                    y = float(row.get(f"left_{lm}_y", 0.0) or 0.0)
                    z = float(row.get(f"left_{lm}_z", 0.0) or 0.0)
                    left_pts.append((x, y, z))

            # Normalize vectors
            right_vec = normalize_21_landmarks(right_pts) if right_present and len(right_pts) == 21 else None
            left_vec = normalize_21_landmarks(left_pts) if left_present and len(left_pts) == 21 else None

            sample_entry = {
                "sample_id": row.get("sample_id", ""),
                "sign_name": sign_name,
                "category": category,
                "two_handed": bool(two_handed),
                "dominant_hand": dominant,
                "right_vec": right_vec,
                "left_vec": left_vec,
                # Primary vector for single-hand queries
                "primary_vec": right_vec if (right_present and dominant != "Left") else (left_vec or right_vec),
                "description": desc,
                "llm_prompt_summary": llm_summary,
            }
            self.samples.append(sample_entry)

    def _load_64col_dataset(self, reader):
        """Loads standard 64-column dataset (label, lm0_x ... lm20_z)."""
        for row in reader:
            label = row.get("label", "").strip().upper()
            if not label:
                continue

            coords = []
            valid = True
            for i in range(21):
                try:
                    coords.append((float(row[f"lm{i}_x"]), float(row[f"lm{i}_y"]), float(row[f"lm{i}_z"])))
                except (KeyError, ValueError):
                    valid = False
                    break
            if not valid:
                continue

            norm_vec = normalize_21_landmarks(coords)
            self.samples.append({
                "sample_id": f"SMP_{len(self.samples)+1}",
                "sign_name": label,
                "category": "Standard",
                "two_handed": False,
                "dominant_hand": "Right",
                "right_vec": norm_vec,
                "left_vec": None,
                "primary_vec": norm_vec,
                "description": f"Standard ASL {label} sign",
                "llm_prompt_summary": f"Hand performing {label}",
            })

    def _load_generic_dataset(self, reader):
        """Fallback for custom CSV files."""
        # Try finding label column and float columns
        for row in reader:
            lbl = row.get("sign_name") or row.get("label") or row.get("sign") or ""
            if not lbl:
                continue
            lbl = lbl.strip().upper()
            self.labels.append(lbl)

    def classify(
        self,
        landmarks: Optional[List[Any]] = None,
        left_landmarks: Optional[List[Any]] = None,
        right_landmarks: Optional[List[Any]] = None,
        handedness: str = "Right",
        top_k: int = 3
    ) -> Dict[str, Any]:
        """
        Classifies current hand landmarks against the CSV dataset.
        Supports both single-hand and dual-hand inputs.
        """
        if not self.samples:
            return {"label": "Unknown", "confidence": 0.0, "distance": 999.0, "top_matches": []}

        has_both_hands = bool(left_landmarks and right_landmarks and len(left_landmarks) >= 21 and len(right_landmarks) >= 21)

        # Normalize inputs
        norm_query_right = None
        norm_query_left = None
        norm_single = None

        if right_landmarks and len(right_landmarks) >= 21:
            try:
                norm_query_right = normalize_21_landmarks(right_landmarks)
            except Exception:
                norm_query_right = None

        if left_landmarks and len(left_landmarks) >= 21:
            try:
                norm_query_left = normalize_21_landmarks(left_landmarks)
            except Exception:
                norm_query_left = None

        if landmarks and len(landmarks) >= 21:
            try:
                norm_single = normalize_21_landmarks(landmarks)
            except Exception:
                norm_single = None

        # Determine best query representation
        if not norm_single:
            norm_single = norm_query_right or norm_query_left

        if not norm_single and not norm_query_right and not norm_query_left:
            return {"label": "Invalid", "confidence": 0.0, "distance": 999.0, "top_matches": []}

        scored_matches = []

        for sample in self.samples:
            dist = 999.0
            is_two_handed_sample = sample.get("two_handed", False)

            # Case A: Two hands active in camera and sample is two-handed
            if has_both_hands and is_two_handed_sample:
                d_r = euclidean_distance(norm_query_right, sample["right_vec"]) if sample.get("right_vec") and norm_query_right else 999.0
                d_l = euclidean_distance(norm_query_left, sample["left_vec"]) if sample.get("left_vec") and norm_query_left else 999.0
                if d_r < 900 and d_l < 900:
                    dist = (d_r + d_l) / 2.0
                elif d_r < 900:
                    dist = d_r * 1.15
                elif d_l < 900:
                    dist = d_l * 1.15
            # Case B: Single hand query (or fallback to primary hand)
            else:
                target_vec = sample.get("primary_vec") or sample.get("right_vec") or sample.get("left_vec")
                if target_vec and norm_single:
                    dist = euclidean_distance(norm_single, target_vec)

            # Penalize mismatching 2-handed vs 1-handed by 20%
            if has_both_hands and not is_two_handed_sample:
                dist *= 1.25
            elif not has_both_hands and is_two_handed_sample:
                dist *= 1.25

            # Calculate confidence: distance 0.4 -> 95%, 1.0 -> 75%, 2.0 -> 0%
            conf = max(0.0, min(100.0, (1.0 - (dist / 2.0)) * 100.0))

            scored_matches.append({
                "sign_name": sample["sign_name"],
                "category": sample.get("category", "General"),
                "two_handed": is_two_handed_sample,
                "distance": round(dist, 4),
                "confidence": round(conf, 1),
                "description": sample.get("description", ""),
                "llm_prompt_summary": sample.get("llm_prompt_summary", "")
            })

        scored_matches.sort(key=lambda m: m["distance"])
        best = scored_matches[0]

        # Top k unique signs
        unique_top = []
        seen = set()
        for m in scored_matches:
            if m["sign_name"] not in seen:
                unique_top.append({
                    "label": m["sign_name"],
                    "confidence": m["confidence"],
                    "distance": m["distance"],
                    "category": m["category"]
                })
                seen.add(m["sign_name"])
            if len(unique_top) >= top_k:
                break

        return {
            "label": best["sign_name"],
            "category": best["category"],
            "confidence": best["confidence"],
            "distance": best["distance"],
            "two_handed": best["two_handed"],
            "description": best["description"],
            "llm_prompt_summary": best["llm_prompt_summary"],
            "top_matches": unique_top
        }

    def get_info(self) -> Dict[str, Any]:
        """Returns metadata about the currently loaded CSV dataset."""
        label_counts = {}
        for s in self.samples:
            lbl = s["sign_name"]
            label_counts[lbl] = label_counts.get(lbl, 0) + 1

        return {
            "csv_path": self.csv_path,
            "filename": os.path.basename(self.csv_path),
            "dataset_format": self.dataset_type,
            "total_samples": len(self.samples),
            "total_labels": len(self.labels),
            "labels": self.labels,
            "label_distribution": label_counts,
            "label_metadata": self.label_info
        }


# Global singleton instance loaded at startup
landmark_classifier = LandmarkClassifier()
