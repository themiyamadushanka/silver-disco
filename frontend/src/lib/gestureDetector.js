/**
 * 3D Landmark & Hand Position Analysis & Gesture Detector
 * Analyzes the 21 MediaPipe hand landmarks to calculate exact 3D coordinates,
 * finger extension states, pinch metrics, and sign language gestures.
 */

// Landmark Index Constants
export const LANDMARK = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
};

/**
 * Calculate 3D Euclidean distance between two points
 */
export function getDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Checks if a finger is extended based on tip distance from wrist vs PIP distance from wrist
 */
function isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx) {
  const wrist = landmarks[LANDMARK.WRIST];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const distTip = getDistance(tip, wrist);
  const distPip = getDistance(pip, wrist);
  const distMcp = getDistance(mcp, wrist);

  // Finger is extended if tip is further from wrist than PIP joint
  return distTip > distPip && distTip > distMcp;
}

/**
 * Detect thumb extension (considers horizontal extension relative to MCP & IP)
 */
function isThumbExtended(landmarks) {
  const wrist = landmarks[LANDMARK.WRIST];
  const thumbTip = landmarks[LANDMARK.THUMB_TIP];
  const thumbIp = landmarks[LANDMARK.THUMB_IP];
  const thumbMcp = landmarks[LANDMARK.THUMB_MCP];
  const indexMcp = landmarks[LANDMARK.INDEX_MCP];

  const distTip = getDistance(thumbTip, wrist);
  const distMcp = getDistance(thumbMcp, wrist);
  const distTipToIndex = getDistance(thumbTip, indexMcp);

  return distTip > distMcp * 1.15 && distTipToIndex > 0.12;
}

/**
 * Extract comprehensive position metrics from hand landmarks
 */
export function extractPositions(landmarks, handedness = "Right") {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[LANDMARK.WRIST];
  const thumb = landmarks[LANDMARK.THUMB_TIP];
  const index = landmarks[LANDMARK.INDEX_TIP];
  const middle = landmarks[LANDMARK.MIDDLE_TIP];
  const ring = landmarks[LANDMARK.RING_TIP];
  const pinky = landmarks[LANDMARK.PINKY_TIP];

  // Finger status
  const thumbExt = isThumbExtended(landmarks);
  const indexExt = isFingerExtended(landmarks, LANDMARK.INDEX_TIP, LANDMARK.INDEX_PIP, LANDMARK.INDEX_MCP);
  const middleExt = isFingerExtended(landmarks, LANDMARK.MIDDLE_TIP, LANDMARK.MIDDLE_PIP, LANDMARK.MIDDLE_MCP);
  const ringExt = isFingerExtended(landmarks, LANDMARK.RING_TIP, LANDMARK.RING_PIP, LANDMARK.RING_MCP);
  const pinkyExt = isFingerExtended(landmarks, LANDMARK.PINKY_TIP, LANDMARK.PINKY_PIP, LANDMARK.PINKY_MCP);

  // Distances & Pinches
  const pinchThumbIndex = getDistance(thumb, index);
  const pinchThumbMiddle = getDistance(thumb, middle);
  const palmSpan = getDistance(landmarks[LANDMARK.INDEX_MCP], landmarks[LANDMARK.PINKY_MCP]);

  return {
    handedness,
    fingers: {
      thumb: { extended: thumbExt, tip: { x: thumb.x, y: thumb.y, z: thumb.z } },
      index: { extended: indexExt, tip: { x: index.x, y: index.y, z: index.z } },
      middle: { extended: middleExt, tip: { x: middle.x, y: middle.y, z: middle.z } },
      ring: { extended: ringExt, tip: { x: ring.x, y: ring.y, z: ring.z } },
      pinky: { extended: pinkyExt, tip: { x: pinky.x, y: pinky.y, z: pinky.z } },
    },
    wrist: { x: wrist.x, y: wrist.y, z: wrist.z },
    metrics: {
      pinchThumbIndex: Math.round(pinchThumbIndex * 100),
      isPinching: pinchThumbIndex < 0.08,
      extendedCount: [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length,
      palmSpan: Math.round(palmSpan * 100),
    },
  };
}

/**
 * Recognize sign language & common hand gestures from landmarks
 */
export function detectGesture(landmarks, positions) {
  if (!landmarks || !positions) return { gesture: "Unknown", label: "Scanning Hand...", confidence: 0 };

  const { fingers, metrics, wrist } = positions;
  const { thumb, index, middle, ring, pinky } = fingers;
  const thumbTip = landmarks[LANDMARK.THUMB_TIP];
  const wristPt = landmarks[LANDMARK.WRIST];

  // 1. "I Love You" (ASL): Thumb + Index + Pinky extended, Middle & Ring curled
  if (thumb.extended && index.extended && !middle.extended && !ring.extended && pinky.extended) {
    return {
      gesture: "ILY",
      label: "I Love You 🤟",
      speechText: "I love you",
      meaning: "Universal ASL sign expressing love and care",
      confidence: 96,
    };
  }

  // 2. "Peace / Victory / Number 2": Index + Middle extended, others curled
  if (!thumb.extended && index.extended && middle.extended && !ring.extended && !pinky.extended) {
    return {
      gesture: "PEACE",
      label: "Peace / Victory ✌️",
      speechText: "Peace",
      meaning: "Peace, victory, or number two",
      confidence: 95,
    };
  }

  // 3. "Call Me / Shaka": Thumb + Pinky extended, Index, Middle, Ring curled
  if (thumb.extended && !index.extended && !middle.extended && !ring.extended && pinky.extended) {
    return {
      gesture: "CALL_ME",
      label: "Call Me 🤙",
      speechText: "Call me",
      meaning: "Call me or friendly greeting",
      confidence: 94,
    };
  }

  // 4. "Rock On / Horns": Index + Pinky extended, Thumb, Middle, Ring curled
  if (!thumb.extended && index.extended && !middle.extended && !ring.extended && pinky.extended) {
    return {
      gesture: "ROCK_ON",
      label: "Rock On 🤘",
      speechText: "Rock on",
      meaning: "Excitement, energy, or music sign",
      confidence: 92,
    };
  }

  // 5. "OK Sign": Thumb & Index pinch together, Middle, Ring, Pinky extended
  if (metrics.pinchThumbIndex < 7 && middle.extended && ring.extended && pinky.extended) {
    return {
      gesture: "OK",
      label: "OK / All Good 👌",
      speechText: "Everything is okay",
      meaning: "Agreement, confirmation, or letter F",
      confidence: 95,
    };
  }

  // 6. "Pointing / Look There": Only Index extended
  if (!thumb.extended && index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    return {
      gesture: "POINTING",
      label: "Pointing 👉",
      speechText: "Look at this",
      meaning: "Direction, attention, or number one",
      confidence: 92,
    };
  }

  // 7. "Thumbs Up / Good / Yes": Thumb pointing up, all other fingers folded
  if (thumb.extended && !index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    const isUp = thumbTip.y < wristPt.y - 0.08;
    const isDown = thumbTip.y > wristPt.y + 0.08;

    if (isUp) {
      return {
        gesture: "THUMBS_UP",
        label: "Thumbs Up / Yes 👍",
        speechText: "Yes, good",
        meaning: "Approval, affirmative, or yes",
        confidence: 95,
      };
    }
    if (isDown) {
      return {
        gesture: "THUMBS_DOWN",
        label: "Thumbs Down / No 👎",
        speechText: "No, bad",
        meaning: "Disapproval, negative, or no",
        confidence: 93,
      };
    }
  }

  // 8. "Closed Fist / Stop / S": All fingers curled
  if (metrics.extendedCount === 0) {
    return {
      gesture: "FIST",
      label: "Closed Fist ✊",
      speechText: "Stop or wait",
      meaning: "Fist, letter S, or strength",
      confidence: 90,
    };
  }

  // 9. "Open Hand / Hello / Wave": All 5 fingers extended
  if (metrics.extendedCount === 5) {
    return {
      gesture: "OPEN_HAND",
      label: "Hello / Open Hand 🖐️",
      speechText: "Hello! Greetings!",
      meaning: "Friendly greeting, waving hello, or number five",
      confidence: 97,
    };
  }

  // 10. "Four Fingers / Letter B": Thumb tucked, 4 fingers extended
  if (!thumb.extended && index.extended && middle.extended && ring.extended && pinky.extended) {
    return {
      gesture: "FOUR",
      label: "Four Fingers / Letter B ✋",
      speechText: "Number four or letter B",
      meaning: "Number four or ASL letter B",
      confidence: 92,
    };
  }

  // 11. "Three Fingers / Letter W": Index + Middle + Ring extended
  if (!thumb.extended && index.extended && middle.extended && ring.extended && !pinky.extended) {
    return {
      gesture: "THREE",
      label: "Three Fingers / Letter W 🖖",
      speechText: "Number three or letter W",
      meaning: "Number three or ASL letter W",
      confidence: 91,
    };
  }

  return {
    gesture: "TRACKING",
    label: `Tracking Hand (${metrics.extendedCount} fingers)`,
    speechText: "",
    meaning: "Adjust hand position in view",
    confidence: 70,
  };
}
