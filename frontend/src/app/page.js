"use client";

import React, { useState } from "react";
import HandCamera from "@/components/HandCamera";
import PositionTracker from "@/components/PositionTracker";
import GestureTranslator from "@/components/GestureTranslator";
import GestureGuide from "@/components/GestureGuide";

export default function Home() {
  const [positions, setPositions] = useState(null);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [isMirror, setIsMirror] = useState(true);

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
