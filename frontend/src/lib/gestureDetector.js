/**
 * 3D Landmark & Hand Position Analysis & Gesture Detector
 * Analyzes the 21 MediaPipe hand landmarks to calculate exact 3D coordinates,
 * finger extension states, pinch metrics, and sign language gestures (Single and Dual-Hand).
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
      pinchThumbMiddle: Math.round(pinchThumbMiddle * 100),
      isPinching: pinchThumbIndex < 0.08,
      extendedCount: [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length,
      palmSpan: Math.round(palmSpan * 100),
    },
  };
}

/**
 * Recognize sign language & common hand gestures from single-hand landmarks
 */
export function detectGesture(landmarks, positions) {
  if (!landmarks || !positions) return { gesture: "Unknown", label: "Scanning Hand...", confidence: 0 };

  const { fingers, metrics } = positions;
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
      isDualHand: false,
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
      isDualHand: false,
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
      isDualHand: false,
    };
  }

  // 4. "Letter L / Gun Shape": Thumb + Index extended at 90 degrees
  if (thumb.extended && index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    return {
      gesture: "LETTER_L",
      label: "Letter L / Angle 👆",
      speechText: "Letter L",
      meaning: "ASL letter L or right-angle pointer",
      confidence: 93,
      isDualHand: false,
    };
  }

  // 5. "Rock On / Horns": Index + Pinky extended, Thumb, Middle, Ring curled
  if (!thumb.extended && index.extended && !middle.extended && !ring.extended && pinky.extended) {
    return {
      gesture: "ROCK_ON",
      label: "Rock On 🤘",
      speechText: "Rock on",
      meaning: "Excitement, energy, or music sign",
      confidence: 92,
      isDualHand: false,
    };
  }

  // 6. "OK Sign": Thumb & Index pinch together, Middle, Ring, Pinky extended
  if (metrics.pinchThumbIndex < 7 && middle.extended && ring.extended && pinky.extended) {
    return {
      gesture: "OK",
      label: "OK / All Good 👌",
      speechText: "Everything is okay",
      meaning: "Agreement, confirmation, or letter F",
      confidence: 95,
      isDualHand: false,
    };
  }

  // 7. "Pointing / Look There": Only Index extended
  if (!thumb.extended && index.extended && !middle.extended && !ring.extended && !pinky.extended) {
    return {
      gesture: "POINTING",
      label: "Pointing 👉",
      speechText: "Look at this",
      meaning: "Direction, attention, or number one",
      confidence: 92,
      isDualHand: false,
    };
  }

  // 8. "Thumbs Up / Good / Yes" vs "Thumbs Down / No"
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
        isDualHand: false,
      };
    }
    if (isDown) {
      return {
        gesture: "THUMBS_DOWN",
        label: "Thumbs Down / No 👎",
        speechText: "No, bad",
        meaning: "Disapproval, negative, or no",
        confidence: 93,
        isDualHand: false,
      };
    }
  }

  // 9. "Closed Fist / Stop / S": All fingers curled
  if (metrics.extendedCount === 0) {
    return {
      gesture: "FIST",
      label: "Closed Fist ✊",
      speechText: "Stop or wait",
      meaning: "Fist, letter S, or strength",
      confidence: 90,
      isDualHand: false,
    };
  }

  // 10. "Open Hand / Hello / Wave": All 5 fingers extended
  if (metrics.extendedCount === 5) {
    return {
      gesture: "OPEN_HAND",
      label: "Hello / Open Hand 🖐️",
      speechText: "Hello! Greetings!",
      meaning: "Friendly greeting, waving hello, or number five",
      confidence: 97,
      isDualHand: false,
    };
  }

  // 11. "Four Fingers / Letter B": Thumb tucked, 4 fingers extended
  if (!thumb.extended && index.extended && middle.extended && ring.extended && pinky.extended) {
    return {
      gesture: "FOUR",
      label: "Four Fingers / Letter B ✋",
      speechText: "Number four or letter B",
      meaning: "Number four or ASL letter B",
      confidence: 92,
      isDualHand: false,
    };
  }

  // 12. "Three Fingers / Letter W": Index + Middle + Ring extended
  if (!thumb.extended && index.extended && middle.extended && ring.extended && !pinky.extended) {
    return {
      gesture: "THREE",
      label: "Three Fingers / Letter W 🖖",
      speechText: "Number three or letter W",
      meaning: "Number three or ASL letter W",
      confidence: 91,
      isDualHand: false,
    };
  }

  return {
    gesture: "TRACKING",
    label: `Tracking Hand (${metrics.extendedCount} fingers)`,
    speechText: "",
    meaning: "Adjust hand position in view",
    confidence: 70,
    isDualHand: false,
  };
}

/**
 * Recognize two-handed sign language gestures when BOTH hands are active in frame
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

  // 1. HELP (Two-Handed ASL): One hand flat palm up, other hand thumbs-up fist resting on top
  const isHand1Base = m1.extendedCount >= 4;
  const isHand2Base = m2.extendedCount >= 4;
  const isHand1ThumbUp = f1.thumb?.extended && m1.extendedCount === 1;
  const isHand2ThumbUp = f2.thumb?.extended && m2.extendedCount === 1;

  if (
    wristDist < 0.26 &&
    ((isHand1Base && isHand2ThumbUp) || (isHand2Base && isHand1ThumbUp))
  ) {
    return {
      gesture: "HELP",
      label: "Help 🆘 (Two-Handed)",
      speechText: "I need help please",
      meaning: "ASL sign for help: dominant thumbs-up fist resting on flat palm base",
      confidence: 98,
      isDualHand: true,
    };
  }

  // 2. PRAY / NAMASTE / RESPECT (Two-Handed): Both hands flat touching vertically
  if (m1.extendedCount >= 4 && m2.extendedCount >= 4 && wristDist < 0.16) {
    const tipDist = getDistance(f1.middle?.tip, f2.middle?.tip);
    if (tipDist < 0.14) {
      return {
        gesture: "PRAY",
        label: "Thank You / Respect 🙏 (Two-Handed)",
        speechText: "Thank you, respect",
        meaning: "Universal sign of prayer, gratitude, and deep respect",
        confidence: 97,
        isDualHand: true,
      };
    }
  }

  // 3. BOOK (Two-Handed ASL): Both flat hands held together opening like pages
  if (m1.extendedCount >= 4 && m2.extendedCount >= 4 && wristDist >= 0.10 && wristDist < 0.28) {
    const pinkyDist = getDistance(f1.pinky?.tip, f2.pinky?.tip);
    if (pinkyDist < 0.18) {
      return {
        gesture: "BOOK",
        label: "Book 📖 (Two-Handed)",
        speechText: "Open the book",
        meaning: "ASL sign for book: both flat hands opening like pages",
        confidence: 95,
        isDualHand: true,
      };
    }
  }

  // 4. HOUSE / ROOF (Two-Handed ASL): Fingertips meeting at peak, wrists spread
  if (m1.extendedCount >= 3 && m2.extendedCount >= 3 && wristDist > 0.16) {
    const indexTipDist = getDistance(f1.index?.tip, f2.index?.tip);
    if (indexTipDist < 0.12) {
      return {
        gesture: "HOUSE",
        label: "House / Home 🏠 (Two-Handed)",
        speechText: "House or home",
        meaning: "ASL sign for house: fingertips meeting at triangular apex",
        confidence: 95,
        isDualHand: true,
      };
    }
  }

  // 5. MORE (Two-Handed ASL): Both hands cupped/pinched touching at center
  if (m1.extendedCount <= 2 && m2.extendedCount <= 2) {
    const indexTipDist = getDistance(f1.index?.tip, f2.index?.tip);
    const thumbTipDist = getDistance(f1.thumb?.tip, f2.thumb?.tip);
    if ((indexTipDist < 0.13 || thumbTipDist < 0.13) && wristDist < 0.22) {
      return {
        gesture: "MORE",
        label: "More 🤲 (Two-Handed)",
        speechText: "More please",
        meaning: "ASL sign for more: both hands cupped fingertips touching",
        confidence: 96,
        isDualHand: true,
      };
    }
  }

  // 6. TOGETHER (Two-Handed ASL): Both hands thumbs-up touching knuckles
  if (isHand1ThumbUp && isHand2ThumbUp && wristDist < 0.20) {
    return {
      gesture: "TOGETHER",
      label: "Together 🤝 (Two-Handed)",
      speechText: "Together",
      meaning: "ASL sign for together: both thumbs-up fists touching at knuckles",
      confidence: 97,
      isDualHand: true,
    };
  }

  // 7. DOUBLE THUMBS UP: Both hands thumbs-up (Awesome / Great)
  if (isHand1ThumbUp && isHand2ThumbUp) {
    return {
      gesture: "EXCELLENT",
      label: "Awesome / Great 👍👍 (Two-Handed)",
      speechText: "Awesome, great job!",
      meaning: "High affirmation, excellence, or double agreement",
      confidence: 97,
      isDualHand: true,
    };
  }

  // 8. DOUBLE PEACE: Both hands peace signs
  const isHand1Peace = !f1.thumb?.extended && f1.index?.extended && f1.middle?.extended && !f1.ring?.extended && !f1.pinky?.extended;
  const isHand2Peace = !f2.thumb?.extended && f2.index?.extended && f2.middle?.extended && !f2.ring?.extended && !f2.pinky?.extended;
  if (isHand1Peace && isHand2Peace) {
    return {
      gesture: "DOUBLE_PEACE",
      label: "Double Peace ✌️✌️ (Two-Handed)",
      speechText: "Peace and happiness",
      meaning: "Double peace gesture or celebration",
      confidence: 96,
      isDualHand: true,
    };
  }

  // 9. DOUBLE I LOVE YOU: Both hands ILY signs
  const isHand1ILY = f1.thumb?.extended && f1.index?.extended && !f1.middle?.extended && !f1.ring?.extended && f1.pinky?.extended;
  const isHand2ILY = f2.thumb?.extended && f2.index?.extended && !f2.middle?.extended && !f2.ring?.extended && f2.pinky?.extended;
  if (isHand1ILY && isHand2ILY) {
    return {
      gesture: "DOUBLE_LOVE",
      label: "Lots of Love 🤟🤟 (Two-Handed)",
      speechText: "Sending you so much love!",
      meaning: "Double ASL I Love You sign expressing deep affection",
      confidence: 98,
      isDualHand: true,
    };
  }

  // 10. APPLAUD (Deaf Community Applause): Both hands raised high waving
  if (m1.extendedCount >= 4 && m2.extendedCount >= 4 && w1.y < 0.45 && w2.y < 0.45) {
    return {
      gesture: "APPLAUD",
      label: "Deaf Applause 👏 (Two-Handed)",
      speechText: "Congratulations! Bravo!",
      meaning: "Deaf community applause: both hands raised and twisting",
      confidence: 95,
      isDualHand: true,
    };
  }

  // 11. FRIEND (Two-Handed ASL): Both index fingers extended & touching
  const isHand1Index = f1.index?.extended && m1.extendedCount === 1;
  const isHand2Index = f2.index?.extended && m2.extendedCount === 1;
  if (isHand1Index && isHand2Index && getDistance(f1.index?.tip, f2.index?.tip) < 0.12) {
    return {
      gesture: "FRIEND",
      label: "Friend 🤞 (Two-Handed)",
      speechText: "My good friend",
      meaning: "ASL sign for friend: interlinked index fingers",
      confidence: 94,
      isDualHand: true,
    };
  }

  // 12. OPEN / BIG: Both open hands spread wide apart
  if (m1.extendedCount === 5 && m2.extendedCount === 5 && wristDist > 0.38) {
    return {
      gesture: "OPEN_BIG",
      label: "Open / Welcome 👐 (Two-Handed)",
      speechText: "Open wide, welcome",
      meaning: "Both hands spread open welcoming or opening",
      confidence: 92,
      isDualHand: true,
    };
  }

  return null;
}
