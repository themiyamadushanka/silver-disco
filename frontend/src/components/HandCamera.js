"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadMediaPipeScripts, HAND_CONNECTIONS } from "@/lib/mediapipe";
import { extractPositions, detectGesture } from "@/lib/gestureDetector";

export default function HandCamera({
  onPositionsUpdate,
  onGestureDetected,
  onSessionResult,
  isMirror = true,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Controls active finger tracking
  const [errorMessage, setErrorMessage] = useState(null);
  const [fps, setFps] = useState(0);
  const [handsCount, setHandsCount] = useState(0);
  const [capturedCount, setCapturedCount] = useState(0);

  const cameraInstanceRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const handsCountRef = useRef(0);
  const isPlayingRef = useRef(false);

  const recordedHandPositionsRef = useRef([]);
  const sessionStartTimeRef = useRef(0);
  const lastCaptureTimeRef = useRef(0);
  const lastHandSeenTimeRef = useRef(0);

  // Keep latest callbacks in ref to avoid re-triggering effects
  const onPositionsUpdateRef = useRef(onPositionsUpdate);
  const onGestureDetectedRef = useRef(onGestureDetected);
  const onSessionResultRef = useRef(onSessionResult);
  useEffect(() => {
    onPositionsUpdateRef.current = onPositionsUpdate;
    onGestureDetectedRef.current = onGestureDetected;
    onSessionResultRef.current = onSessionResult;
  }, [onPositionsUpdate, onGestureDetected, onSessionResult]);

  // Initialize MediaPipe Hands and Camera
  const initMediaPipe = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      await loadMediaPipeScripts();

      if (!videoRef.current || !canvasRef.current) return;

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      // Sensitivity set to 0.45 for instant tracking
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45,
      });

      hands.onResults(onResults);
      handsInstanceRef.current = hands;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (
            videoRef.current &&
            videoRef.current.readyState >= 2 &&
            handsInstanceRef.current
          ) {
            try {
              await handsInstanceRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.warn("MediaPipe send frame error:", err);
            }
          }
        },
        width: 640,
        height: 480,
      });

      await camera.start();
      cameraInstanceRef.current = camera;
      setIsRunning(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Camera / MediaPipe initialization failed:", err);
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access in your browser."
          : `Failed to start camera: ${err.message}`
      );
      setIsLoading(false);
      setIsRunning(false);
    }
  };

  const handlePlay = () => {
    if (!isRunning) {
      initMediaPipe();
    }
    setIsPlaying(true);
    isPlayingRef.current = true;
    recordedHandPositionsRef.current = [];
    sessionStartTimeRef.current = performance.now();
    setCapturedCount(0);
  };

  const handlePause = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;

    // Clear canvas when paused
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (onPositionsUpdateRef.current) onPositionsUpdateRef.current(null);
    if (onGestureDetectedRef.current) onGestureDetectedRef.current(null);

    const capturedList = [...recordedHandPositionsRef.current];

    // 1. Send complete captured list to Next.js logger and Azure AI Foundry
    fetch("/api/log-positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "PAUSE",
        hand_positions_list: capturedList,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const sentenceText = data?.full_string || data?.sentence;
        if (sentenceText && typeof window !== "undefined" && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(sentenceText);
          window.speechSynthesis.speak(utterance);
        }
        if (onSessionResultRef.current && sentenceText) {
          onSessionResultRef.current({
            sentence: sentenceText,
            totalFrames: data?.total_frames || capturedList.length,
            detectedSigns: data?.detected_signs || data?.signs || [],
            source: "Azure AI Foundry (gpt-5-mini)",
          });
        }
      })
      .catch((err) => console.warn("AI session trigger error:", err));

    // 2. Save directly into Python backend list in memory and on disk
    fetch("http://127.0.0.1:8000/api/v1/ai/analyze-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frames: capturedList,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Successfully saved in Python list:", data);
        if (onSessionResultRef.current && data?.meaningful_sentence) {
          onSessionResultRef.current({
            sentence: data.meaningful_sentence,
            totalFrames: data.total_frames || capturedList.length,
            detectedSigns: data.detected_signs || [],
            source: data.source || "Python List & Azure AI",
          });
        }
      })
      .catch(() => {}); // Graceful if backend terminal isn't started yet

    recordedHandPositionsRef.current = [];
    setCapturedCount(0);
  };

  const stopCamera = () => {
    handlePause();
    if (cameraInstanceRef.current) {
      cameraInstanceRef.current.stop();
      cameraInstanceRef.current = null;
    }
    if (handsInstanceRef.current) {
      handsInstanceRef.current.close();
      handsInstanceRef.current = null;
    }
    setIsRunning(false);
  };

  useEffect(() => {
    initMediaPipe();
    return () => {
      stopCamera();
    };
  }, []);

  // Handle MediaPipe inference output
  const onResults = (results) => {
    const now = performance.now();

    // Calculate FPS
    frameCountRef.current += 1;
    if (now - lastTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // ONLY TRACK FINGERS IF PLAY IS ACTIVE!
    if (!isPlayingRef.current) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const detectedCount = results.multiHandLandmarks?.length || 0;

    if (handsCountRef.current !== detectedCount) {
      handsCountRef.current = detectedCount;
      setHandsCount(detectedCount);
    }

    if (detectedCount > 0) {
      lastHandSeenTimeRef.current = now;
      const primaryLandmarks = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness?.[0]?.label || "Right";

      let leftHand = null;
      let rightHand = null;
      results.multiHandLandmarks.forEach((lm, idx) => {
        const hLabel = results.multiHandedness?.[idx]?.label || (idx === 0 ? "Right" : "Left");
        if (hLabel === "Left") leftHand = lm;
        else rightHand = lm;
      });
      if (!rightHand && primaryLandmarks) rightHand = primaryLandmarks;

      const positions = extractPositions(primaryLandmarks, handedness);
      const gesture = detectGesture(primaryLandmarks, positions);

      // Capture into chronological finger positions list every 75ms while playing
      if (now - lastCaptureTimeRef.current >= 75) {
        lastCaptureTimeRef.current = now;
        recordedHandPositionsRef.current.push({
          time_ms: Math.round(now - sessionStartTimeRef.current),
          wrist: positions?.wrist,
          fingers: positions?.fingers,
          metrics: positions?.metrics,
          gesture: gesture,
          raw_landmarks: primaryLandmarks.map((p) => ({
            x: Math.round(p.x * 10000) / 10000,
            y: Math.round(p.y * 10000) / 10000,
            z: Math.round(p.z * 10000) / 10000,
          })),
          left_landmarks: leftHand
            ? leftHand.map((p) => ({
                x: Math.round(p.x * 10000) / 10000,
                y: Math.round(p.y * 10000) / 10000,
                z: Math.round(p.z * 10000) / 10000,
              }))
            : null,
          right_landmarks: rightHand
            ? rightHand.map((p) => ({
                x: Math.round(p.x * 10000) / 10000,
                y: Math.round(p.y * 10000) / 10000,
                z: Math.round(p.z * 10000) / 10000,
              }))
            : null,
          two_handed: detectedCount >= 2,
          handedness: handedness,
        });
        setCapturedCount(recordedHandPositionsRef.current.length);
      }

      // Throttle React UI state updates to every 40ms (~25 FPS) for smooth real-time coordinates
      if (now - lastUiUpdateRef.current >= 40) {
        lastUiUpdateRef.current = now;
        if (onPositionsUpdateRef.current) onPositionsUpdateRef.current(positions);
        if (onGestureDetectedRef.current) onGestureDetectedRef.current(gesture);
      }

      // Draw all detected hands on canvas at full 60 FPS
      results.multiHandLandmarks.forEach((landmarks) => {
        // Draw glowing skeletal connections
        ctx.lineWidth = 3.5;
        HAND_CONNECTIONS.forEach(([i, j]) => {
          const p1 = landmarks[i];
          const p2 = landmarks[j];

          const grad = ctx.createLinearGradient(
            p1.x * width, p1.y * height,
            p2.x * width, p2.y * height
          );
          grad.addColorStop(0, "rgba(99, 102, 241, 0.85)");
          grad.addColorStop(1, "rgba(6, 182, 212, 0.85)");

          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        });

        // Draw 21 landmarks
        landmarks.forEach((pt, idx) => {
          const x = pt.x * width;
          const y = pt.y * height;

          let nodeColor = "#818cf8";
          let radius = 4;

          // Tip highlights
          if (idx === 4) { nodeColor = "#f59e0b"; radius = 6.5; } // Thumb Tip
          else if (idx === 8) { nodeColor = "#06b6d4"; radius = 6.5; } // Index Tip
          else if (idx === 12) { nodeColor = "#6366f1"; radius = 6.5; } // Middle Tip
          else if (idx === 16) { nodeColor = "#a855f7"; radius = 6.5; } // Ring Tip
          else if (idx === 20) { nodeColor = "#f43f5e"; radius = 6.5; } // Pinky Tip
          else if (idx === 0) { nodeColor = "#10b981"; radius = 7; } // Wrist

          // Outer glow ring
          ctx.beginPath();
          ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.fill();

          // Main node circle
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = nodeColor;
          ctx.fill();
        });
      });
    } else {
      // Only clear coordinates if no hand has been detected for over 800ms
      if (now - lastHandSeenTimeRef.current > 800) {
        if (now - lastUiUpdateRef.current >= 150) {
          lastUiUpdateRef.current = now;
          if (onPositionsUpdateRef.current) onPositionsUpdateRef.current(null);
          if (onGestureDetectedRef.current) onGestureDetectedRef.current(null);
        }
      }
    }

    ctx.restore();
  };

  return (
    <div className="camera-card">
      <div className="camera-header">
        <div className="camera-title-group">
          <div className="badge-pulse-indicator">
            <span className={`pulse-dot ${isPlaying ? "active" : ""}`}></span>
            <span>{isPlaying ? "Tracking Active (Live)" : "Tracking Paused"}</span>
          </div>
          <span className="camera-specs">
            {isPlaying ? `${fps} FPS • ${capturedCount} Finger Snapshots Captured` : "Click ▶ Play to Track"}
          </span>
        </div>

        <div className="camera-buttons">
          {isPlaying ? (
            <button
              className="btn btn-danger btn-sm"
              onClick={handlePause}
              id="btn-pause-tracking"
              title="Pause tracking and send captured finger positions to AI"
            >
              ⏸ Pause &amp; Analyze with AI
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePlay}
              disabled={isLoading}
              id="btn-play-tracking"
              title="Start tracking hand and finger positions"
            >
              ▶ Play (Start Tracking Fingers)
            </button>
          )}
        </div>
      </div>

      <div className="video-viewport-wrapper">
        {/* Actual webcam video element */}
        <video
          ref={videoRef}
          className={`video-feed ${isMirror ? "mirror" : ""}`}
          autoPlay
          playsInline
          muted
        />

        {/* Real-time skeleton canvas overlay */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ zIndex: 3 }}
          className={`canvas-overlay ${isMirror ? "mirror" : ""}`}
        />

        {/* Overlay when paused */}
        {isRunning && !isPlaying && (
          <div className="camera-overlay-message" style={{ background: "rgba(7, 10, 18, 0.65)" }}>
            <span style={{ fontSize: "2.5rem" }}>⏸️</span>
            <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Finger Tracking is Paused</p>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Click <strong>&quot;▶ Play&quot;</strong> above to start capturing finger movements.
            </span>
            <button className="btn btn-primary btn-sm" onClick={handlePlay} style={{ marginTop: "8px" }}>
              ▶ Play (Start Tracking)
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="camera-overlay-message">
            <div className="spinner"></div>
            <p>Loading MediaPipe Hand Tracking...</p>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Initializing GPU acceleration &amp; WebAssembly
            </span>
          </div>
        )}

        {/* Error overlay */}
        {errorMessage && (
          <div className="camera-overlay-message error">
            <span style={{ fontSize: "2rem" }}>⚠️</span>
            <p style={{ fontWeight: 600 }}>{errorMessage}</p>
            <button className="btn btn-primary btn-sm" onClick={initMediaPipe}>
              Retry Camera Access
            </button>
          </div>
        )}

        {/* Guide banner when playing but no hand detected yet */}
        {isRunning && isPlaying && handsCount === 0 && (
          <div className="no-hand-guide">
            <span>👋 Show your hand to start capturing finger positions...</span>
          </div>
        )}
      </div>
    </div>
  );
}
