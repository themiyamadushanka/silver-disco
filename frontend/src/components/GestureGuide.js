"use client";

import React from "react";

export default function GestureGuide() {
  const guideItems = [
    {
      sign: "🖐️ Open Palm / Wave",
      speech: '"Hello! Greetings!"',
      action: "Extend all 5 fingers upright facing the camera",
      meaning: "Universal friendly greeting",
      badge: "Greeting",
    },
    {
      sign: "🤟 I Love You",
      speech: '"I love you"',
      action: "Extend Thumb, Index, and Pinky; fold Middle and Ring",
      meaning: "ASL sign expressing care & affection",
      badge: "ASL",
    },
    {
      sign: "👍 Thumbs Up",
      speech: '"Yes, good"',
      action: "Extend thumb upwards with all fingers curled into a fist",
      meaning: "Agreement, affirmative, or yes",
      badge: "Everyday",
    },
    {
      sign: "👎 Thumbs Down",
      speech: '"No, bad"',
      action: "Point thumb downwards with all fingers curled into a fist",
      meaning: "Disagreement, negative, or no",
      badge: "Everyday",
    },
    {
      sign: "✌️ Peace / Victory",
      speech: '"Peace"',
      action: "Extend Index and Middle in a V; fold Ring, Pinky, and Thumb",
      meaning: "Peace sign or number 2",
      badge: "Number / Sign",
    },
    {
      sign: "👌 OK / All Good",
      speech: '"Everything is okay"',
      action: "Pinch Thumb and Index tips together; keep other 3 fingers open",
      meaning: "Everything is fine / Letter F",
      badge: "ASL / Universal",
    },
    {
      sign: "🤙 Call Me",
      speech: '"Call me"',
      action: "Extend Thumb and Pinky; keep Index, Middle, Ring curled",
      meaning: "Phone call or relaxed greeting",
      badge: "Everyday",
    },
    {
      sign: "👉 Pointing",
      speech: '"Look at this"',
      action: "Extend only the Index finger; curl all other fingers",
      meaning: "Attention, direction, or number 1",
      badge: "Everyday",
    },
    {
      sign: "✊ Closed Fist",
      speech: '"Stop or wait"',
      action: "Curl all fingers into a firm fist",
      meaning: "Stop, wait, or ASL letter S",
      badge: "Control",
    },
    {
      sign: "🤘 Rock On",
      speech: '"Rock on"',
      action: "Extend Index and Pinky; fold Middle, Ring, and Thumb",
      meaning: "High energy or music gesture",
      badge: "Expression",
    },
  ];

  return (
    <div className="card guide-card" id="gesture-guide-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon">📖</div>
          <div>
            <h2 className="card-title">Sign Language & Gesture Dictionary</h2>
            <p className="stat-label">Quick reference guide to test and practice signs</p>
          </div>
        </div>
        <div className="badge">
          <span>{guideItems.length} Signs Supported</span>
        </div>
      </div>

      <div className="guide-grid">
        {guideItems.map((item, idx) => (
          <div key={idx} className="guide-item-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span className="guide-sign-title">{item.sign}</span>
              <span className="guide-badge">{item.badge}</span>
            </div>
            <div className="guide-speech-text">
              🗣️ Translates to: <strong>{item.speech}</strong>
            </div>
            <div className="guide-action-text">
              📍 Hand Pose: {item.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
