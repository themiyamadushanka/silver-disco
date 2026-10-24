/**
 * Temporal Gesture Stabilizer
 * Buffers video frames across a temporal window (~300ms) to verify hand signs
 * before displaying them on screen and triggering voice synthesis.
 * Eliminates transitional jitter, brief false positives, and screen flickering.
 */

export class TemporalGestureStabilizer {
  constructor(options = {}) {
    // Time needed in milliseconds to verify a steady gesture
    this.stabilizationMs = options.stabilizationMs ?? 320;
    // Minimum consecutive frames required
    this.minConsensusFrames = options.minConsensusFrames ?? 6;
    // Timeout before clearing a verified gesture when hand leaves frame
    this.noHandTimeoutMs = options.noHandTimeoutMs ?? 400;

    this.candidateGesture = null;
    this.candidateStartTime = 0;
    this.candidateFrameCount = 0;

    this.verifiedGesture = null;
    this.lastActiveTime = 0;
  }

  /**
   * Process a new raw instantaneous detection and return stabilized result
   */
  update(rawGesture, timestamp = performance.now()) {
    // If no gesture or generic tracking
    if (!rawGesture || rawGesture.gesture === "Unknown" || rawGesture.gesture === "TRACKING") {
      if (timestamp - this.lastActiveTime > this.noHandTimeoutMs) {
        this.candidateGesture = null;
        this.candidateFrameCount = 0;
        this.verifiedGesture = null;
      }
      return {
        gesture: this.verifiedGesture,
        candidate: null,
        isVerifying: false,
        verificationProgress: 0,
        isVerified: Boolean(this.verifiedGesture),
      };
    }

    this.lastActiveTime = timestamp;
    const rawKey = rawGesture.gesture;

    // Check if matching current candidate
    if (this.candidateGesture && this.candidateGesture.gesture === rawKey) {
      this.candidateFrameCount += 1;
      const elapsed = timestamp - this.candidateStartTime;
      const progress = Math.min(100, Math.round((elapsed / this.stabilizationMs) * 100));

      // Successfully verified!
      if (elapsed >= this.stabilizationMs && this.candidateFrameCount >= this.minConsensusFrames) {
        this.verifiedGesture = {
          ...rawGesture,
          isVerified: true,
          verificationProgress: 100,
        };
      }

      const isCurrentVerified = this.verifiedGesture?.gesture === rawKey;

      return {
        gesture: isCurrentVerified ? this.verifiedGesture : this.verifiedGesture,
        candidate: this.candidateGesture,
        isVerifying: !isCurrentVerified,
        verificationProgress: isCurrentVerified ? 100 : progress,
        isVerified: isCurrentVerified,
        pendingLabel: this.candidateGesture.label,
      };
    } else {
      // New candidate pose detected: start verification countdown
      this.candidateGesture = rawGesture;
      this.candidateStartTime = timestamp;
      this.candidateFrameCount = 1;

      return {
        // Keep existing verified gesture visible so screen doesn't jump during hand movement!
        gesture: this.verifiedGesture,
        candidate: this.candidateGesture,
        isVerifying: true,
        verificationProgress: 15,
        isVerified: false,
        pendingLabel: this.candidateGesture.label,
      };
    }
  }

  reset() {
    this.candidateGesture = null;
    this.candidateFrameCount = 0;
    this.verifiedGesture = null;
  }
}
