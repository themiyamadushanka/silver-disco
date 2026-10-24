import fs from "fs";
import path from "path";

const LANDMARK_NAMES = [
  "wrist",
  "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip",
  "index_mcp", "index_pip", "index_dip", "index_tip",
  "middle_mcp", "middle_pip", "middle_dip", "middle_tip",
  "ring_mcp", "ring_pip", "ring_dip", "ring_tip",
  "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip"
];

let cachedDataset = null;

function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const wx = landmarks[0].x || 0;
  const wy = landmarks[0].y || 0;
  const wz = landmarks[0].z || 0;

  const rel = landmarks.slice(0, 21).map((p) => ({
    x: (p.x || 0) - wx,
    y: (p.y || 0) - wy,
    z: (p.z || 0) - wz,
  }));

  const m = rel[9];
  const scale = Math.sqrt(m.x * m.x + m.y * m.y + m.z * m.z) || 1.0;

  const flat = [];
  for (const p of rel) {
    flat.push(p.x / scale, p.y / scale, p.z / scale);
  }
  return flat;
}

function euclideanDist(v1, v2) {
  if (!v1 || !v2 || v1.length !== v2.length) return 999;
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum / v1.length);
}

export function loadCsvDataset() {
  if (cachedDataset) return cachedDataset;

  const possiblePaths = [
    path.join(process.cwd(), "sign_language_dual_hands_dataset.csv"),
    path.join(process.cwd(), "backend", "data", "sign_language_dual_hands_dataset.csv"),
    path.join(process.cwd(), "..", "sign_language_dual_hands_dataset.csv"),
  ];

  let csvContent = null;
  let activePath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvContent = fs.readFileSync(p, "utf-8");
      activePath = p;
      break;
    }
  }

  if (!csvContent) {
    console.warn("[CSV Classifier] sign_language_dual_hands_dataset.csv not found");
    return [];
  }

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const samples = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // Simple CSV row parser (handles quotes)
    const values = [];
    let insideQuote = false;
    let cur = "";
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '"') {
        insideQuote = !insideQuote;
      } else if (ch === "," && !insideQuote) {
        values.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());

    if (values.length < headers.length - 2) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || "";
    });

    const signName = (rowObj.sign_name || "").toUpperCase();
    if (!signName) continue;

    const rightPresent = parseInt(rowObj.right_present || "0", 10) === 1;
    const leftPresent = parseInt(rowObj.left_present || "0", 10) === 1;
    const twoHanded = parseInt(rowObj.two_handed || "0", 10) === 1;

    let rightVec = null;
    if (rightPresent) {
      const rightPts = LANDMARK_NAMES.map((lm) => ({
        x: parseFloat(rowObj[`right_${lm}_x`] || 0),
        y: parseFloat(rowObj[`right_${lm}_y`] || 0),
        z: parseFloat(rowObj[`right_${lm}_z`] || 0),
      }));
      rightVec = normalizeLandmarks(rightPts);
    }

    let leftVec = null;
    if (leftPresent) {
      const leftPts = LANDMARK_NAMES.map((lm) => ({
        x: parseFloat(rowObj[`left_${lm}_x`] || 0),
        y: parseFloat(rowObj[`left_${lm}_y`] || 0),
        z: parseFloat(rowObj[`left_${lm}_z`] || 0),
      }));
      leftVec = normalizeLandmarks(leftPts);
    }

    samples.push({
      signName,
      category: rowObj.category || "General",
      twoHanded,
      dominantHand: rowObj.dominant_hand || "Right",
      rightVec,
      leftVec,
      primaryVec: rightVec || leftVec,
      description: rowObj.description || "",
      llmSummary: rowObj.llm_prompt_summary || "",
    });
  }

  cachedDataset = samples;
  console.log(`[CSV Classifier] Loaded ${samples.length} samples from ${path.basename(activePath)}`);
  return samples;
}

export function classifyLandmarks(landmarks, leftLandmarks, rightLandmarks) {
  const dataset = loadCsvDataset();
  if (!dataset || dataset.length === 0) return null;

  const querySingle = normalizeLandmarks(landmarks);
  const queryRight = normalizeLandmarks(rightLandmarks);
  const queryLeft = normalizeLandmarks(leftLandmarks);
  const hasBoth = Boolean(queryLeft && queryRight);

  let best = null;
  let bestDist = 999;

  for (const s of dataset) {
    let dist = 999;
    if (hasBoth && s.twoHanded && s.rightVec && s.leftVec) {
      const dr = euclideanDist(queryRight, s.rightVec);
      const dl = euclideanDist(queryLeft, s.leftVec);
      dist = (dr + dl) / 2.0;
    } else {
      const target = s.primaryVec || s.rightVec || s.leftVec;
      const q = querySingle || queryRight || queryLeft;
      if (target && q) {
        dist = euclideanDist(q, target);
      }
    }

    // Penalize mismatching 2-handed vs 1-handed
    if (hasBoth && !s.twoHanded) dist *= 1.25;
    if (!hasBoth && s.twoHanded) dist *= 1.25;

    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }

  if (!best) return null;

  const confidence = Math.max(0, Math.min(100, Math.round((1 - bestDist / 2.0) * 100)));

  return {
    label: best.signName,
    category: best.category,
    confidence,
    distance: Math.round(bestDist * 1000) / 1000,
    description: best.description,
    llmSummary: best.llmSummary,
  };
}
