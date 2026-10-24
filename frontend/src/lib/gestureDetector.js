/**
 * 3D Landmark & Hand Position Analysis & Gesture Detector
 * Highly Distinct & Mutually Exclusive Sign Language Classifier
 * Every sign has a unique biometric signature to prevent overlap, false triggers, and repetition.
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

  return distTip > distPip && distTip > distMcp;
}

/**
 * Detect thumb extension (considers horizontal extension relative to MCP & IP)
 */
function isThumbExtended(landmarks) {
  const wrist = landmarks[LANDMARK.WRIST];
  const thumbTip = landmarks[LANDMARK.THUMB_TIP];
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

  // Individual finger states
  const thumbExt = isThumbExtended(landmarks);
  const indexExt = isFingerExtended(landmarks, LANDMARK.INDEX_TIP, LANDMARK.INDEX_PIP, LANDMARK.INDEX_MCP);
  const middleExt = isFingerExtended(landmarks, LANDMARK.MIDDLE_TIP, LANDMARK.MIDDLE_PIP, LANDMARK.MIDDLE_MCP);
  const ringExt = isFingerExtended(landmarks, LANDMARK.RING_TIP, LANDMARK.RING_PIP, LANDMARK.RING_MCP);
  const pinkyExt = isFingerExtended(landmarks, LANDMARK.PINKY_TIP, LANDMARK.PINKY_PIP, LANDMARK.PINKY_MCP);

  // Distances & Pinches
  const pinchThumbIndex = getDistance(thumb, index);
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
      isPinching: pinchThumbIndex < 0.07,
      extendedCount: [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length,
      palmSpan: Math.round(palmSpan * 100),
    },
  };
}

/**
 * 10 Distinct, Non-Overlapping Single-Hand Signs
 */
export function detectGesture(landmarks, positions) {
  if (!landmarks || !positions) return { gesture: "Unknown", label: "Scanning Hand...", confidence: 0 };

  const { fingers, metrics } = positions;
  const { thumb, index, middle, ring, pinky } = fingers;
  const thumbTip = landmarks[LANDMARK.THUMB_TIP];
  const wristPt = landmarks[LANDMARK.WRIST];
  const extCount = metrics.extendedCount;

  // 1. "I Love You" (ASL): ONLY Thumb + Index + Pinky extended (Middle & Ring folded)
  if (thumb.extended && index.extended && !middle.extended && !ring.extended && pinky.extended) {
    return {
      gesture: "ILY",
      label: "I Love You 🤟",
      speechText: "I love you",
      meaning: "Universal ASL sign expressing care & affection",
      confidence: 97,
      isDualHand: false,
    };
  }

  // 2. "Call Me / Shaka": ONLY Thumb + Pinky extended (Index, Middle, Ring folded)
  if (thumb.extended && !index.extended && !middle.extended && !ring.extended && pinky.extended) {
    return {
      gesture: "CALL_ME",
      label: "Call Me 🤙",
      speechText: "Call me",
      meaning: "Universal phone call or relaxed friendly greeting",
      confidence: 96,
      isDualHand: false,
    };
  }

  // 3. "Rock On / Horns": ONLY Index + Pinky extended (Thumb folded or holding middle)
  if (!thumb.extended && index.extended && !middle.extended && !ring.extended && pinky.extended) {
    return {
      gesture: "ROCK_ON",
      label: "Rock On 🤘",
      speechText: "Rock on",
      meaning: "Excitement, energy, and music gesture",
      confidence: 95,
      isDualHand: false,
    };
  }

  // 4. "Peace / Victory / Number 2": ONLY Index + Middle extended (Others curled)
  if (!thumb.extended && index.extended && middle.extended && !ring.extended && !pinky.extended) {
    return {
      gesture: "PEACE",
      label: "Peace / Victory ✌️",
      speechText: "Peace",
      meaning: "Peace sign or number two",
      confidence: 96,
      isDualHand: false,
    };
  }

  // 5. "OK Sign": Thumb & Index pinch circle, while Middle, Ring, Pinky are all extended
  if (metrics.pinchThumbIndex < 7 && middle.extended && ring.extended && pinky.extended) {
    return {
      gesture: "OK",
      label: "OK / All Good 👌",
      speechText: "Everything is okay",
      meaning: "Agreement, confirmation, or ASL letter F",
      confidence: 96,
      isDualHand: false,
    };
  }

  // 6. "Pointing": ONLY Index extended straight
  if (!thumb.extended && index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    return {
      gesture: "POINTING",
      label: "Pointing 👉",
      speechText: "Look at this",
      meaning: "Direction, focus, or number one",
      confidence: 95,
      isDualHand: false,
    };
  }

  // 7. "Thumbs Up" (YES) vs "Thumbs Down" (NO): ONLY Thumb extended
  if (thumb.extended && !index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    const isUp = thumbTip.y < wristPt.y - 0.07;
    const isDown = thumbTip.y > wristPt.y + 0.07;

    if (isUp) {
      return {
        gesture: "THUMBS_UP",
        label: "Thumbs Up / Yes 👍",
        speechText: "Yes, good",
        meaning: "Approval, affirmative, or yes",
        confidence: 97,
        isDualHand: false,
      };
    }
    if (isDown) {
      return {
        gesture: "THUMBS_DOWN",
        label: "Thumbs Down / No 👎",
        speechText: "No, bad",
        meaning: "Disapproval, negative, or no",
        confidence: 95,
        isDualHand: false,
      };
    }
  }

  // 8. "Closed Fist / Stop": 0 fingers extended
  if (extCount === 0) {
    return {
      gesture: "FIST",
      label: "Closed Fist / Stop ✊",
      speechText: "Stop or wait",
      meaning: "Firm fist: stop, wait, or strength",
      confidence: 94,
      isDualHand: false,
    };
  }

  // 9. "Hello / Open Hand": ALL 5 fingers extended wide
  if (extCount === 5) {
    return {
      gesture: "OPEN_HAND",
      label: "Hello / Open Hand 🖐️",
      speechText: "Hello! Greetings!",
      meaning: "Friendly greeting or number five",
      confidence: 98,
      isDualHand: false,
    };
  }

  return {
    gesture: "TRACKING",
    label: `Tracking Hand (${extCount} fingers)`,
    speechText: "",
    meaning: "Adjust hand position in view",
    confidence: 70,
    isDualHand: false,
  };
}

/**
 * 7 Distinct, Non-Overlapping Two-Handed Signs
 * Each has an unmistakable dual-hand spatial and contact signature.
 */
export function detectDualHandGesture(lm1, pos1, lm2, pos2) {
  if (!pos1 || !pos2 || !lm1 || !lm2) return null;

  const w1 = pos1.wrist;
  const w2 = pos2.wrist;
  const wristDist = getDistance(w1, w2);

  const m1 = pos1.metrics || {};
  const m2 = pos2.metrics || {};
  const f1 = pos1.fingers || {};
  const f2 = pos2.fingers || {};

  const isHand1Base = m1.extendedCount >= 4;
  const isHand2Base = m2.extendedCount >= 4;
  const isHand1ThumbUp = f1.thumb?.extended && m1.extendedCount === 1;
  const isHand2ThumbUp = f2.thumb?.extended && m2.extendedCount === 1;

  // 1. HELP (Two-Handed ASL): One hand flat palm up, other hand thumbs-up fist resting on top
  if (
    wristDist < 0.25 &&
    ((isHand1Base && isHand2ThumbUp) || (isHand2Base && isHand1ThumbUp))
  ) {
    return {
      gesture: "HELP",
      label: "Help 🆘 (Two-Handed)",
      speechText: "I need help please",
      meaning: "ASL sign for help: dominant thumbs-up fist on flat palm base",
      confidence: 99,
      isDualHand: true,
    };
  }

  // 2. TIME / WATCH: Index finger pointing and tapping the other wrist
  const isHand1Index = f1.index?.extended && m1.extendedCount === 1;
  const isHand2Index = f2.index?.extended && m2.extendedCount === 1;
  if ((isHand1Index && getDistance(f1.index?.tip, w2) < 0.13) || (isHand2Index && getDistance(f2.index?.tip, w1) < 0.13)) {
    return {
      gesture: "TIME_WATCH",
      label: "Time / Watch ⏱️ (Two-Handed)",
      speechText: "What time is it?",
      meaning: "Universal sign for time: tapping the wrist watch",
      confidence: 98,
      isDualHand: true,
    };
  }

  // 3. PRAY / RESPECT: Both flat hands pressed vertically together palm-to-palm
  if (m1.extendedCount >= 4 && m2.extendedCount >= 4 && wristDist < 0.16) {
    const tipDist = getDistance(f1.middle?.tip, f2.middle?.tip);
    if (tipDist < 0.13) {
      return {
        gesture: "PRAY",
        label: "Thank You / Respect 🙏 (Two-Handed)",
        speechText: "Thank you, respect",
        meaning: "Universal sign of prayer, gratitude, and deep respect",
        confidence: 98,
        isDualHand: true,
      };
    }
  }

  // 4. BOOK (Two-Handed ASL): Both flat hands held side-by-side with pinkies touching
  if (m1.extendedCount >= 4 && m2.extendedCount >= 4 && wristDist >= 0.11 && wristDist < 0.27) {
    const pinkyDist = getDistance(f1.pinky?.tip, f2.pinky?.tip);
    if (pinkyDist < 0.18) {
      return {
        gesture: "BOOK",
        label: "Book 📖 (Two-Handed)",
        speechText: "Open the book",
        meaning: "ASL sign for book: both flat hands opening like pages",
        confidence: 96,
        isDualHand: true,
      };
    }
  }

  // 5. HOUSE / ROOF (Two-Handed ASL): Fingertips meeting at apex with wrists separated
  if (m1.extendedCount >= 3 && m2.extendedCount >= 3 && wristDist > 0.17) {
    const indexTipDist = getDistance(f1.index?.tip, f2.index?.tip);
    if (indexTipDist < 0.11) {
      return {
        gesture: "HOUSE",
        label: "House / Home 🏠 (Two-Handed)",
        speechText: "House or home",
        meaning: "ASL sign for house: fingertips meeting at triangular apex",
        confidence: 96,
        isDualHand: true,
      };
    }
  }

  // 6. TOGETHER (Two-Handed ASL): Both hands in thumbs-up touching at knuckles
  if (isHand1ThumbUp && isHand2ThumbUp && wristDist < 0.20) {
    return {
      gesture: "TOGETHER",
      label: "Together 🤝 (Two-Handed)",
      speechText: "Together",
      meaning: "ASL sign for together: both thumbs-up fists touching at knuckles",
      confidence: 98,
      isDualHand: true,
    };
  }

  // 7. MORE (Two-Handed ASL): Both hands cupped/pinched fingertips touching at center
  if (m1.extendedCount <= 2 && m2.extendedCount <= 2) {
    const indexTipDist = getDistance(f1.index?.tip, f2.index?.tip);
    const thumbTipDist = getDistance(f1.thumb?.tip, f2.thumb?.tip);
    if ((indexTipDist < 0.12 || thumbTipDist < 0.12) && wristDist < 0.22) {
      return {
        gesture: "MORE",
        label: "More 🤲 (Two-Handed)",
        speechText: "More please",
        meaning: "ASL sign for more: both hands cupped fingertips touching",
        confidence: 97,
        isDualHand: true,
      };
    }
  }

  return null;
}
