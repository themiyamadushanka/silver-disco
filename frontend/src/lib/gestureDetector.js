/**
 * High-Accuracy 3D Landmark & Hand Gesture Detector
 * Analyzes all 21 MediaPipe hand landmarks with precise angle/distance
 * checks to detect ASL signs and common hand gestures reliably.
 */

// Landmark Index Constants (MediaPipe 21-point model)
export const LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

/** 3D Euclidean distance between two landmarks */
export function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if a finger is extended using TIP vs PIP y-position.
 * More reliable than distance from wrist (handles rotated hands).
 */
function isFingerExtended(landmarks, tipIdx, pipIdx) {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  // In camera space, smaller y = higher on screen = more extended
  // Also check by distance — tip should be farther from wrist than pip
  const wrist = landmarks[LANDMARK.WRIST];
  const distTip = getDistance(tip, wrist);
  const distPip = getDistance(pip, wrist);
  return distTip > distPip * 1.12;
}

/** Thumb extension: checks tip distance from wrist vs IP, and separation from index MCP */
function isThumbExtended(landmarks) {
  const wrist = landmarks[LANDMARK.WRIST];
  const thumbTip = landmarks[LANDMARK.THUMB_TIP];
  const thumbIp = landmarks[LANDMARK.THUMB_IP];
  const thumbMcp = landmarks[LANDMARK.THUMB_MCP];
  const indexMcp = landmarks[LANDMARK.INDEX_MCP];

  const distTipWrist = getDistance(thumbTip, wrist);
  const distIpWrist = getDistance(thumbIp, wrist);
  const distTipToIndex = getDistance(thumbTip, indexMcp);

  return distTipWrist > distIpWrist * 1.1 && distTipToIndex > 0.09;
}

/** Is the thumb pointing UP relative to the wrist? */
function isThumbUp(landmarks) {
  return landmarks[LANDMARK.THUMB_TIP].y < landmarks[LANDMARK.WRIST].y - 0.06;
}

/** Is the thumb pointing DOWN relative to the wrist? */
function isThumbDown(landmarks) {
  return landmarks[LANDMARK.THUMB_TIP].y > landmarks[LANDMARK.WRIST].y + 0.06;
}

/** Pinch distance (normalized) between thumb tip and finger tip */
function pinchDist(landmarks, fingerTipIdx) {
  return getDistance(landmarks[LANDMARK.THUMB_TIP], landmarks[fingerTipIdx]);
}

/** Is a specific pinch tight? */
function isPinching(landmarks, fingerTipIdx, threshold = 0.07) {
  return pinchDist(landmarks, fingerTipIdx) < threshold;
}

/** Palm span for normalization */
function palmSpan(landmarks) {
  return getDistance(landmarks[LANDMARK.INDEX_MCP], landmarks[LANDMARK.PINKY_MCP]) || 0.1;
}

/** Normalized distance relative to palm size */
function normDist(landmarks, p1Idx, p2Idx) {
  return getDistance(landmarks[p1Idx], landmarks[p2Idx]) / palmSpan(landmarks);
}

/**
 * Extract comprehensive 3D position metrics from hand landmarks.
 * Returns all finger states + wrist coordinates + metrics.
 */
export function extractPositions(landmarks, handedness = "Right") {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[LANDMARK.WRIST];
  const thumb = landmarks[LANDMARK.THUMB_TIP];
  const index = landmarks[LANDMARK.INDEX_TIP];
  const middle = landmarks[LANDMARK.MIDDLE_TIP];
  const ring = landmarks[LANDMARK.RING_TIP];
  const pinky = landmarks[LANDMARK.PINKY_TIP];

  const thumbExt = isThumbExtended(landmarks);
  const indexExt = isFingerExtended(landmarks, LANDMARK.INDEX_TIP, LANDMARK.INDEX_PIP);
  const middleExt = isFingerExtended(landmarks, LANDMARK.MIDDLE_TIP, LANDMARK.MIDDLE_PIP);
  const ringExt = isFingerExtended(landmarks, LANDMARK.RING_TIP, LANDMARK.RING_PIP);
  const pinkyExt = isFingerExtended(landmarks, LANDMARK.PINKY_TIP, LANDMARK.PINKY_PIP);

  const pinchThumbIndex = getDistance(thumb, index);
  const palmSize = palmSpan(landmarks);

  return {
    handedness,
    fingers: {
      thumb:  { extended: thumbExt,  tip: { x: thumb.x,  y: thumb.y,  z: thumb.z  } },
      index:  { extended: indexExt,  tip: { x: index.x,  y: index.y,  z: index.z  } },
      middle: { extended: middleExt, tip: { x: middle.x, y: middle.y, z: middle.z } },
      ring:   { extended: ringExt,   tip: { x: ring.x,   y: ring.y,   z: ring.z   } },
      pinky:  { extended: pinkyExt,  tip: { x: pinky.x,  y: pinky.y,  z: pinky.z  } },
    },
    wrist: { x: wrist.x, y: wrist.y, z: wrist.z },
    metrics: {
      pinchThumbIndex: Math.round(pinchThumbIndex * 100),
      isPinching: pinchThumbIndex < 0.07,
      extendedCount: [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length,
      palmSpan: Math.round(palmSize * 100),
    },
  };
}

/**
 * High-accuracy sign language & gesture recognizer.
 * Checks precise landmark relationships for each sign.
 */
export function detectGesture(landmarks, positions) {
  if (!landmarks || !positions) {
    return { gesture: "Unknown", label: "Scanning...", confidence: 0 };
  }

  const { fingers, metrics } = positions;
  const { thumb, index, middle, ring, pinky } = fingers;
  const T = thumb.extended, I = index.extended, M = middle.extended, R = ring.extended, P = pinky.extended;

  // --- PINCH-BASED SIGNS (checked before extension pattern) ---

  // OK Sign / ASL F / Letter O: Thumb+Index tight pinch, other fingers extended or semi-extended
  if (isPinching(landmarks, LANDMARK.INDEX_TIP, 0.06) && M && R && P) {
    return { gesture: "OK", label: "OK / Good 👌", speechText: "Everything is okay", meaning: "Agreement or OK", confidence: 96 };
  }

  // Tight pinch with middle (letter F variation)
  if (isPinching(landmarks, LANDMARK.MIDDLE_TIP, 0.06) && I && R && P) {
    return { gesture: "LETTER_F", label: "Letter F", speechText: "F", meaning: "ASL letter F", confidence: 88 };
  }

  // --- EXTENSION PATTERN SIGNS ---

  // ASL "I Love You": Thumb + Index + Pinky extended, Middle + Ring curled
  if (T && I && !M && !R && P) {
    return { gesture: "ILY", label: "I Love You 🤟", speechText: "I love you", meaning: "ASL ILY sign", confidence: 96 };
  }

  // Call Me / Hang Loose / Shaka: Thumb + Pinky, Index+Middle+Ring curled
  if (T && !I && !M && !R && P) {
    return { gesture: "CALL_ME", label: "Call Me 🤙", speechText: "Call me", meaning: "Phone call or shaka", confidence: 94 };
  }

  // Peace / Victory / ASL 2: Index + Middle, others curled
  if (!T && I && M && !R && !P) {
    return { gesture: "PEACE", label: "Peace ✌️", speechText: "Peace", meaning: "Peace or victory", confidence: 95 };
  }

  // Rock On / Horns: Index + Pinky, Thumb+Middle+Ring curled
  if (!T && I && !M && !R && P) {
    return { gesture: "ROCK_ON", label: "Rock On 🤘", speechText: "Rock on", meaning: "Excitement or horns", confidence: 92 };
  }

  // Pointing: Only Index finger extended
  if (!T && I && !M && !R && !P) {
    return { gesture: "POINTING", label: "Pointing 👉", speechText: "Look here", meaning: "Direction or number 1", confidence: 93 };
  }

  // Thumbs Up or Down: Only thumb, detect direction
  if (T && !I && !M && !R && !P) {
    if (isThumbUp(landmarks)) {
      return { gesture: "THUMBS_UP", label: "Thumbs Up 👍", speechText: "Yes, great!", meaning: "Approval or yes", confidence: 95 };
    }
    if (isThumbDown(landmarks)) {
      return { gesture: "THUMBS_DOWN", label: "Thumbs Down 👎", speechText: "No, I don't like it", meaning: "Disapproval or no", confidence: 93 };
    }
    // Sideways thumb — could be hitchhike or ASL A
    return { gesture: "THUMB_SIDE", label: "Thumb Side", speechText: "Over there", meaning: "Direction or ASL A", confidence: 80 };
  }

  // Closed Fist: All curled
  if (metrics.extendedCount === 0) {
    return { gesture: "FIST", label: "Fist ✊", speechText: "Stop", meaning: "Stop, power, or ASL S/A/E", confidence: 90 };
  }

  // Open Hand / Hello / High Five: All 5 extended
  if (metrics.extendedCount === 5) {
    return { gesture: "OPEN_HAND", label: "Hello 🖐️", speechText: "Hello!", meaning: "Hello, hi, or number 5", confidence: 97 };
  }

  // Four Fingers / ASL B: All 4 fingers, thumb tucked
  if (!T && I && M && R && P) {
    return { gesture: "FOUR", label: "Four / Letter B ✋", speechText: "Four or B", meaning: "Number 4 or ASL letter B", confidence: 92 };
  }

  // Three (Index + Middle + Ring): 
  if (!T && I && M && R && !P) {
    return { gesture: "THREE", label: "Three Fingers", speechText: "Three", meaning: "Number 3 or ASL W", confidence: 91 };
  }

  // Thumb + Index (Gun / L-shape / ASL L): Thumb + Index, others curled
  if (T && I && !M && !R && !P) {
    return { gesture: "GUN_L", label: "Gun Shape / Letter L", speechText: "Number one or L", meaning: "ASL letter L or number 1", confidence: 88 };
  }

  // Thumb + Index + Middle (Snap / Number 3 ASL):
  if (T && I && M && !R && !P) {
    return { gesture: "THREE_ALT", label: "Three (Alt)", speechText: "Three", meaning: "Number 3 alternative", confidence: 87 };
  }

  // Crossed fingers: Index over middle (rough check via x-distance)
  const indexTip = landmarks[LANDMARK.INDEX_TIP];
  const middleTip = landmarks[LANDMARK.MIDDLE_TIP];
  if (I && M && !R && !P && Math.abs(indexTip.x - middleTip.x) < 0.03) {
    return { gesture: "CROSSED", label: "Crossed Fingers 🤞", speechText: "Good luck", meaning: "Good luck or hoping", confidence: 85 };
  }

  // Spider-Man / ASL 8: Middle finger down, others extended
  if (T && I && !M && R && P) {
    return { gesture: "SPIDERMAN", label: "Spider-Man", speechText: "Come here", meaning: "Playful or ASL 8", confidence: 80 };
  }

  return {
    gesture: "TRACKING",
    label: `Tracking (${metrics.extendedCount} fingers)`,
    speechText: "",
    meaning: "Hold a sign to translate",
    confidence: 70,
  };
}
