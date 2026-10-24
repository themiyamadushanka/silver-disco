"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadMediaPipeScripts, HAND_CONNECTIONS } from "@/lib/mediapipe";
import { extractPositions, detectGesture } from "@/lib/gestureDetector";

export default function HandCamera({ onPositionsUpdate, onGestureDetected, isMirror = true }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fps, setFps] = useState(0);
  const [handsCount, setHandsCount] = useState(0);

  const cameraInstanceRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const handsCountRef = useRef(0);

  // Keep latest callbacks in ref to avoid re-triggering effects
  const onPositionsUpdateRef = useRef(onPositionsUpdate);
  const onGestureDetectedRef = useRef(onGestureDetected);
  useEffect(() => {
    onPositionsUpdateRef.current = onPositionsUpdate;
    onGestureDetectedRef.current = onGestureDetected;
  }, [onPositionsUpdate, onGestureDetected]);

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

      // Lower confidence threshold to 0.45 for responsive detection in all lighting
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

  const stopCamera = () => {
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

  const lastHandSeenTimeRef = useRef(0);

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

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const detectedCount = results.multiHandLandmarks?.length || 0;

    // Update handsCount state only when the count changes
    if (handsCountRef.current !== detectedCount) {
      handsCountRef.current = detectedCount;
      setHandsCount(detectedCount);
    }

    if (detectedCount > 0) {
      lastHandSeenTimeRef.current = now;
      const primaryLandmarks = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness?.[0]?.label || "Right";

      // Throttle React UI state updates to every 40ms (~25 FPS) for smooth real-time coordinates
      if (now - lastUiUpdateRef.current >= 40) {
        lastUiUpdateRef.current = now;
        const positions = extractPositions(primaryLandmarks, handedness);
        const gesture = detectGesture(primaryLandmarks, positions);

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
      // Only clear coordinates if no hand has been detected for over 800ms to prevent jitter/flicker
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
            <span className={`pulse-dot ${isRunning ? "active" : ""}`}></span>
            <span>{isRunning ? "Camera Live" : "Camera Inactive"}</span>
          </div>
          <span className="camera-specs">
            {isRunning ? `${fps} FPS • ${handsCount} Hand(s) Detected` : "Ready"}
          </span>
        </div>

        <div className="camera-buttons">
          {isRunning ? (
            <button className="btn btn-secondary btn-sm" onClick={stopCamera} id="btn-stop-camera">
              ⏸ Pause
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={initMediaPipe}
              disabled={isLoading}
              id="btn-start-camera"
            >
              {isLoading ? "Starting..." : "▶ Start Camera"}
            </button>
          )}
        </div>
      </div>

      <div className="video-viewport-wrapper">
        {/* Actual webcam video element with autoPlay */}
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

        {/* Loading overlay */}
        {isLoading && (
          <div className="camera-overlay-message">
            <div className="spinner"></div>
            <p>Loading MediaPipe Hand Tracking...</p>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Initializing GPU acceleration & WebAssembly
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

        {/* Instructions overlay when no hand is in frame */}
        {isRunning && handsCount === 0 && (
          <div className="no-hand-guide">
            <span>👋 Hold your hand inside camera view to track positions & signs</span>
          </div>
        )}
      </div>
    </div>
  );
}
