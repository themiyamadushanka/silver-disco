"use client";

import React, { useState, useEffect, useRef } from "react";
import HandCamera from "@/components/HandCamera";
import PositionTracker from "@/components/PositionTracker";
import GestureTranslator from "@/components/GestureTranslator";
import GestureGuide from "@/components/GestureGuide";

export default function Home() {
  const [positions, setPositions] = useState(null);
  const [handsPositions, setHandsPositions] = useState([]);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [isMirror, setIsMirror] = useState(true);
  const [isStreamingToTerminal, setIsStreamingToTerminal] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

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
    if (handsPositions.length === 0) return;
    const now = Date.now();
    if (now - lastTerminalLogRef.current >= 400) {
      lastTerminalLogRef.current = now;
      fetch("/api/log-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hands: handsPositions,
          gesture: currentGesture,
        }),
      }).catch(() => {});
    }
  }, [handsPositions, currentGesture]);

  // Send coordinates over WebSocket whenever positions or gesture update
  useEffect(() => {
    if (
      isStreamingToTerminal &&
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      handsPositions.length > 0
    ) {
      const payload = {
        hands: handsPositions,
        gesture: currentGesture,
      };
      socketRef.current.send(JSON.stringify(payload));
    }
  }, [handsPositions, currentGesture, isStreamingToTerminal]);

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
          <div className="hero-pill">
            <span>⚡ Real-Time MediaPipe Computer Vision (Client-Side)</span>
          </div>
          <h2 className="hero-title">
            Track Hand Positions &amp; <span className="text-gradient">Translate Signs to Voice</span>
          </h2>
          <p className="hero-description">
            Open your camera to track 21 3D hand joints in real-time. Understand hand
            gestures used by mute individuals and automatically translate them into spoken voice
            and subtitles for normal people.
          </p>
        </section>

        {/* Primary Interactive Workspace Grid */}
        <div className="grid-main-workspace">
          {/* Left Column: Camera Feed with Skeletal Canvas Overlay */}
          <div className="workspace-column">
            <HandCamera
              onPositionsUpdate={setPositions}
              onHandsUpdate={setHandsPositions}
              onGestureDetected={setCurrentGesture}
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
