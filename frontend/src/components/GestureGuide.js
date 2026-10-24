"use client";

import React, { useState } from "react";

export default function GestureGuide() {
  const [activeFilter, setActiveFilter] = useState("all");

  const guideItems = [
    // --- 7 DISTINCT TWO-HANDED SIGNS ---
    {
      sign: "🆘 Help (Two-Handed)",
      speech: '"I need help please"',
      action: "Left flat palm facing up; Right thumbs-up fist resting on top",
      meaning: "ASL sign for help: fist on flat palm base",
      badge: "Emergency",
      isDual: true,
    },
    {
      sign: "⏱️ Time / Watch (Two-Handed)",
      speech: '"What time is it?"',
      action: "Right index finger tapping the back of the left wrist",
      meaning: "Universal sign for time: tapping wrist watch",
      badge: "Everyday",
      isDual: true,
    },
    {
      sign: "🙏 Thank You / Respect (Two-Handed)",
      speech: '"Thank you, respect"',
      action: "Both flat hands pressed vertically together palm-to-palm",
      meaning: "Universal gratitude, Namaste, and deep respect",
      badge: "Courtesy",
      isDual: true,
    },
    {
      sign: "📖 Book (Two-Handed)",
      speech: '"Open the book"',
      action: "Both flat hands held together, opening outward like pages",
      meaning: "ASL sign for book: opening palms outward",
      badge: "Education",
      isDual: true,
    },
    {
      sign: "🤝 Together (Two-Handed)",
      speech: '"Together"',
      action: "Both thumbs-up fists touching side-by-side at knuckles",
      meaning: "ASL sign for together & unity",
      badge: "Social",
      isDual: true,
    },
    {
      sign: "🏠 House / Home (Two-Handed)",
      speech: '"House or home"',
      action: "Both flat hands angled inward; fingertips touching at a peak",
      meaning: "ASL sign for house: triangular roof apex",
      badge: "Everyday",
      isDual: true,
    },
    {
      sign: "🤲 More (Two-Handed)",
      speech: '"More please"',
      action: "Both hands with cupped/pinched fingertips touching at chest",
      meaning: "ASL sign for more: fingertips meeting at center",
      badge: "Basics",
      isDual: true,
    },

    // --- 10 DISTINCT SINGLE-HAND SIGNS ---
    {
      sign: "🖐️ Hello / Open Hand",
      speech: '"Hello! Greetings!"',
      action: "Extend all 5 fingers upright facing the camera",
      meaning: "Universal friendly greeting or number 5",
      badge: "Greeting",
      isDual: false,
    },
    {
      sign: "✊ Closed Fist / Stop",
      speech: '"Stop or wait"',
      action: "Curl all fingers into a firm fist (0 fingers extended)",
      meaning: "Stop, wait, or strength",
      badge: "Control",
      isDual: false,
    },
    {
      sign: "👍 Thumbs Up / Yes",
      speech: '"Yes, good"',
      action: "Extend ONLY thumb upwards with fingers in a fist",
      meaning: "Agreement, affirmative, or yes",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "👎 Thumbs Down / No",
      speech: '"No, bad"',
      action: "Point ONLY thumb downwards with fingers in a fist",
      meaning: "Disagreement, negative, or no",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "✌️ Peace / Victory",
      speech: '"Peace"',
      action: "Extend ONLY Index and Middle in a V-shape",
      meaning: "Peace sign or number 2",
      badge: "Universal",
      isDual: false,
    },
    {
      sign: "🤟 I Love You",
      speech: '"I love you"',
      action: "Extend Thumb, Index, and Pinky (fold Middle and Ring)",
      meaning: "ASL sign expressing care & affection",
      badge: "ASL",
      isDual: false,
    },
    {
      sign: "👌 OK / All Good",
      speech: '"Everything is okay"',
      action: "Pinch Thumb and Index tips together; keep other 3 fingers open",
      meaning: "Everything is fine / ASL letter F",
      badge: "Universal",
      isDual: false,
    },
    {
      sign: "🤙 Call Me / Shaka",
      speech: '"Call me"',
      action: "Extend ONLY Thumb and Pinky; curl Index, Middle, Ring",
      meaning: "Phone call or relaxed friendly greeting",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "👉 Pointing",
      speech: '"Look at this"',
      action: "Extend ONLY Index finger; curl all other fingers",
      meaning: "Attention, direction, or number 1",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "🤘 Rock On",
      speech: '"Rock on"',
      action: "Extend ONLY Index and Pinky; hold down Middle and Ring",
      meaning: "High energy, music gesture, or horns",
      badge: "Expression",
      isDual: false,
    },
  ];

  const filteredItems = guideItems.filter((item) => {
    if (activeFilter === "dual") return item.isDual;
    if (activeFilter === "single") return !item.isDual;
    return true;
  });

  const dualCount = guideItems.filter((i) => i.isDual).length;
  const singleCount = guideItems.filter((i) => !i.isDual).length;

  return (
    <div className="card guide-card" id="gesture-guide-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon">📖</div>
          <div>
            <h2 className="card-title">Distinct Sign Language Dictionary</h2>
            <p className="stat-label">Curated, high-accuracy signs with mutually exclusive 3D biometric signatures</p>
          </div>
        </div>
        <div className="badge connected">
          <span className="badge-pulse"></span>
          <span>{guideItems.length} Distinct Signs</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        <button
          type="button"
          className={`btn ${activeFilter === "all" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "6px 14px", fontSize: "0.82rem" }}
          onClick={() => setActiveFilter("all")}
        >
          🌟 All Signs ({guideItems.length})
        </button>
        <button
          type="button"
          className={`btn ${activeFilter === "dual" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "6px 14px", fontSize: "0.82rem" }}
          onClick={() => setActiveFilter("dual")}
        >
          👐 Two-Handed Signs ({dualCount})
        </button>
        <button
          type="button"
          className={`btn ${activeFilter === "single" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "6px 14px", fontSize: "0.82rem" }}
          onClick={() => setActiveFilter("single")}
        >
          ✋ Single Hand Signs ({singleCount})
        </button>
      </div>

      <div className="guide-grid">
        {filteredItems.map((item, idx) => (
          <div key={idx} className="guide-item-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span className="guide-sign-title">{item.sign}</span>
              <span
                className="guide-badge"
                style={item.isDual ? { background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.4)" } : {}}
              >
                {item.isDual ? "👐 Dual Hands" : item.badge}
              </span>
            </div>
            <div className="guide-speech-text">
              🗣️ Translates to: <strong>{item.speech}</strong>
            </div>
            <div className="guide-action-text" style={{ marginTop: "6px" }}>
              📍 <strong>Biometric Signature:</strong> {item.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
