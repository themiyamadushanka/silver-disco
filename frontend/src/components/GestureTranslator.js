"use client";

import React, { useState, useEffect, useRef } from "react";
import { speakText, stopSpeech } from "@/lib/speech";

export default function GestureTranslator({ gesture }) {
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [sentence, setSentence] = useState([]);
  const [history, setHistory] = useState([]);
  const [holdProgress, setHoldProgress] = useState(0);

  const lastGestureRef = useRef(null);
  const holdStartRef = useRef(null);
  const committedGestureRef = useRef(null);

  // Gesture Verification & Commitment:
  // Commits to voice & sentence only once the sign is verified stable across ~300ms
  useEffect(() => {
    if (
      !gesture ||
      !gesture.isVerified ||
      gesture.gesture === "Unknown" ||
      gesture.gesture === "TRACKING" ||
      gesture.gesture === "VERIFYING"
    ) {
      return;
    }

    const currentKey = gesture.gesture;

    if (committedGestureRef.current !== currentKey) {
      committedGestureRef.current = currentKey;

      // Auto speak translation
      if (autoSpeak && gesture.speechText) {
        speakText(gesture.speechText, { rate: speechRate });
      }

      // Add to sentence buffer
      const cleanWord = gesture.speechText || gesture.label;
      setSentence((prev) => [...prev, cleanWord]);

      // Add to history
      setHistory((prev) => [
        {
          id: Date.now(),
          label: gesture.label,
          speechText: gesture.speechText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 7),
      ]);
    }
  }, [gesture, autoSpeak, speechRate]);

  // Reset committed gesture when hand is released
  useEffect(() => {
    if (!gesture) {
      committedGestureRef.current = null;
    }
  }, [gesture]);

  const handleManualSpeak = () => {
    if (gesture?.speechText) {
      speakText(gesture.speechText, { rate: speechRate, interrupt: true });
    }
  };

  const handleSpeakSentence = () => {
    if (sentence.length > 0) {
      const fullText = sentence.join(" ");
      speakText(fullText, { rate: speechRate, interrupt: true });
    }
  };

  const handleClearSentence = () => {
    setSentence([]);
    stopSpeech();
  };

  const handleBackspace = () => {
    setSentence((prev) => prev.slice(0, -1));
  };

  return (
    <div className="card translator-card" id="translator-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon">🗣️</div>
          <div>
            <h2 className="card-title">Mute Sign Translator</h2>
            <p className="stat-label">Speech & Text Translation for Hearing Individuals</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              id="checkbox-auto-speak"
            />
            <span>Auto Voice</span>
          </label>
        </div>
      </div>

      {/* Active Gesture Banner */}
      <div className="active-gesture-banner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="stat-label">Current Sign</span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {gesture?.isDualHand && (
              <span className="confidence-pill" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white" }}>
                👐 Two-Handed
              </span>
            )}
            {gesture?.isVerifying && (
              <span className="confidence-pill" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
                ⏳ Verifying ({gesture.verificationProgress || 0}%)
              </span>
            )}
            {gesture?.isVerified && (
              <span className="confidence-pill" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                ✓ Verified
              </span>
            )}
            {gesture && gesture.confidence > 0 && !gesture.isVerifying && (
              <span className="confidence-pill">{gesture.confidence}% Match</span>
            )}
          </div>
        </div>

        <div className="gesture-display-title">
          {gesture
            ? gesture.isVerifying
              ? `⏳ Verifying: ${gesture.pendingLabel || gesture.label}...`
              : gesture.label
            : "Show hand to translate..."}
        </div>

        {gesture?.meaning && (
          <div className="gesture-display-meaning">
            Meaning: {gesture.meaning}
          </div>
        )}

        {/* Hold & Verification Confirmation Bar */}
        {gesture?.isVerifying && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              <span>Verifying Sign Stability...</span>
              <span>{gesture.verificationProgress || 0}%</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill hold-fill"
                style={{ width: `${gesture.verificationProgress || 0}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Quick Manual Voice Button */}
        {gesture?.speechText && (
          <div style={{ marginTop: "12px" }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleManualSpeak}
              id="btn-speak-now"
            >
              🔊 Speak: &quot;{gesture.speechText}&quot;
            </button>
          </div>
        )}
      </div>

      {/* Sentence Builder Buffer */}
      <div className="sentence-buffer-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span className="stat-label">Translated Sentence</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className="btn btn-secondary btn-icon-sm"
              onClick={handleBackspace}
              disabled={sentence.length === 0}
              title="Delete last word"
            >
              ⌫
            </button>
            <button
              className="btn btn-danger btn-icon-sm"
              onClick={handleClearSentence}
              disabled={sentence.length === 0}
              title="Clear all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="sentence-text-display">
          {sentence.length > 0 ? (
            sentence.map((word, i) => (
              <span key={i} className="sentence-word-tag">
                {word}
              </span>
            ))
          ) : (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              Signs will accumulate here to form full sentences...
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSpeakSentence}
            disabled={sentence.length === 0}
            id="btn-speak-full-sentence"
          >
            🔊 Speak Full Sentence
          </button>
        </div>
      </div>


    </div>
  );
}
