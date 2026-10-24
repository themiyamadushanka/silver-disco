"use client";

import React, { useState, useEffect, useRef } from "react";
import HandCamera from "@/components/HandCamera";
import PositionTracker from "@/components/PositionTracker";
import GestureTranslator from "@/components/GestureTranslator";
import GestureGuide from "@/components/GestureGuide";

export default function Home() {
  const [positions, setPositions] = useState(null);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [isMirror, setIsMirror] = useState(true);
  const [isStreamingToTerminal, setIsStreamingToTerminal] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);

  const socketRef = useRef(null);

  // Manage WebSocket connection to FastAPI backend terminal stream
  useEffect(() => {
    if (!isStreamingToTerminal) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setWsConnected(false);
      return;
    }

    const wsUrl = "ws://127.0.0.1:8000/api/v1/ws/hand-stream";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
      console.log("WebSocket connected to FastAPI terminal stream.");
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log("WebSocket terminal stream disconnected.");
    };

    ws.onerror = (err) => {
      console.warn("WebSocket connection error:", err);
      setWsConnected(false);
    };

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [isStreamingToTerminal]);

  // Automatically log all finger positions directly to the npm run dev terminal
  const lastTerminalLogRef = useRef(0);
  useEffect(() => {
    if (!positions) return;
    const now = Date.now();
    if (now - lastTerminalLogRef.current >= 400) {
      lastTerminalLogRef.current = now;
      fetch("/api/log-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wrist: positions.wrist,
          fingers: positions.fingers,
          metrics: positions.metrics,
          gesture: currentGesture,
          handedness: positions.handedness,
        }),
      }).catch(() => {});
    }
  }, [positions, currentGesture]);

  // Send coordinates over WebSocket whenever positions or gesture update
  useEffect(() => {
    if (
      isStreamingToTerminal &&
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      positions
    ) {
      const payload = {
        wrist: positions.wrist,
        fingers: positions.fingers,
        metrics: positions.metrics,
        gesture: currentGesture,
      };
      socketRef.current.send(JSON.stringify(payload));
    }
  }, [positions, currentGesture, isStreamingToTerminal]);

  return (
    <div>
      {/* Top Navigation Header */}
      <header className="header">
        <div className="container header-content">
          <div className="brand-section">
            <div className="brand-logo">🖐️</div>
            <div>
              <h1 className="brand-title">SignBridge AI</h1>
              <p className="brand-subtitle">MediaPipe Hand &amp; 3D Position Tracker • Mute Sign Translator</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className={`btn btn-sm ${isStreamingToTerminal ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setIsStreamingToTerminal((prev) => !prev)}
              id="btn-stream-terminal"
              title="Stream live coordinates to FastAPI terminal"
            >
              💻 {isStreamingToTerminal ? (wsConnected ? "Terminal Stream: Active" : "Connecting Terminal...") : "Stream to Terminal: Off"}
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsMirror((prev) => !prev)}
              id="btn-toggle-mirror"
            >
              🔄 {isMirror ? "Mirror: On" : "Mirror: Off"}
            </button>

            <div className={`badge ${positions ? "connected" : ""}`}>
              <span className="badge-pulse"></span>
              <span>{positions ? "Hand Tracking Active" : "Waiting for Hand"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingBottom: "60px" }}>
        {/* Hero Section */}
        <section className="hero">
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px" }}>
            <div className="hero-pill">
              <span>⚡ Real-Time MediaPipe 3D Hand Tracking</span>
            </div>
            <div
              className="hero-pill"
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))",
                borderColor: "rgba(16, 185, 129, 0.4)",
                color: "#10b981",
              }}
            >
              <span>📊 Active CSV Dataset: <strong>sign_language_dual_hands_dataset.csv</strong> (300 Samples • 20 ASL Signs)</span>
            </div>
          </div>
          <h2 className="hero-title">
            Track Hand Positions &amp; <span className="text-gradient">Translate Signs to Voice</span>
          </h2>
          <p className="hero-description">
            Capture 3D hand landmarks in real-time, match against the professional 300-sample
            ASL CSV dataset, and translate mute sign sequences into spoken natural sentences with Azure AI Foundry.
          </p>
        </section>

        {/* Real-Time Session AI Result Card */}
        {sessionResult && (
          <div
            className="card"
            style={{
              marginBottom: "24px",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              boxShadow: "0 10px 30px rgba(99, 102, 241, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.4rem" }}>✨</span>
                <span style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: "0.95rem" }}>
                  AI Generated Sentence (From {sessionResult.totalFrames} Finger Snapshots)
                </span>
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "12px" }}>
                {sessionResult.source}
              </span>
            </div>

            {/* Display Recognized CSV Signs sequence */}
            {sessionResult.detectedSigns && sessionResult.detectedSigns.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0 12px 0", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>CSV Dataset Signs:</span>
                {sessionResult.detectedSigns.map((sign, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(99, 102, 241, 0.25)",
                      border: "1px solid rgba(99, 102, 241, 0.5)",
                      color: "#e2e8f0",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      letterSpacing: "0.5px"
                    }}
                  >
                    {sign}
                  </span>
                ))}
              </div>
            )}

            <p
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#f8fafc",
                lineHeight: 1.5,
                margin: "8px 0 0 0",
              }}
            >
              &ldquo;{sessionResult.sentence}&rdquo;
            </p>
          </div>
        )}

        {/* Primary Interactive Workspace Grid */}
        <div className="grid-main-workspace">
          {/* Left Column: Camera Feed with Skeletal Canvas Overlay */}
          <div className="workspace-column">
            <HandCamera
              onPositionsUpdate={setPositions}
              onGestureDetected={setCurrentGesture}
              onSessionResult={setSessionResult}
              isMirror={isMirror}
            />
          </div>

          {/* Right Column: Position Tracker & Sign Translator */}
          <div className="workspace-column side-panel">
            <GestureTranslator gesture={currentGesture} />
            <PositionTracker positions={positions} />
          </div>
        </div>

        {/* Gesture Dictionary & Reference Sheet */}
        <div style={{ marginTop: "32px" }}>
          <GestureGuide />
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>
            SignBridge AI • Real-Time MediaPipe Hand Landmark &amp; Position Tracker • Empowering Accessible Communication
          </p>
        </footer>
      </main>
    </div>
  );
}
