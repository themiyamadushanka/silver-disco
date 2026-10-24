"use client";

import React, { useState } from "react";

export default function GestureGuide() {
  const [activeFilter, setActiveFilter] = useState("all");

  const guideItems = [
    // --- TWO-HANDED SIGNS (17) ---
    {
      sign: "🆘 Help (Two-Handed)",
      speech: '"I need help please"',
      action: "Left flat palm facing up; Right thumbs-up fist resting on top",
      meaning: "ASL sign for help: fist on flat palm base",
      badge: "Emergency",
      isDual: true,
    },
    {
      sign: "🛑 Stop / Chop (Two-Handed)",
      speech: '"Stop right now"',
      action: "Left flat palm horizontal; Right flat hand chopping down onto it",
      meaning: "ASL sign for stop: sharp chop on open palm",
      badge: "Directives",
      isDual: true,
    },
    {
      sign: "⏱️ Time / Watch (Two-Handed)",
      speech: '"What time is it?"',
      action: "Right index finger pointing and tapping the back of the left wrist",
      meaning: "Universal sign for time: tapping wrist watch",
      badge: "Everyday",
      isDual: true,
    },
    {
      sign: "❤️ Heart / Love (Two-Handed)",
      speech: '"With all my heart, I love you"',
      action: "Both index fingers and thumbs curved meeting into a heart shape",
      meaning: "Two-handed heart shape expressing deep love",
      badge: "Emotion",
      isDual: true,
    },
    {
      sign: "🤲 More (Two-Handed)",
      speech: '"More please"',
      action: "Both hands cupped/pinched fingertips touching at chest",
      meaning: "ASL sign for more: fingertips meeting at center",
      badge: "Basics",
      isDual: true,
    },
    {
      sign: "📖 Book (Two-Handed)",
      speech: '"Open the book"',
      action: "Both flat palms held together, then opened like pages",
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
      sign: "🟰 Same / Equal (Two-Handed)",
      speech: '"It is the same, equal"',
      action: "Both index fingers pointing horizontally towards each other",
      meaning: "ASL sign for same: index fingers held parallel",
      badge: "Concepts",
      isDual: true,
    },
    {
      sign: "👨‍👩‍👧 Family (Two-Handed)",
      speech: '"Family"',
      action: "Both hands in 'OK' pinch shape touching at fingertips",
      meaning: "ASL sign for family: 'F' handshapes circling and touching",
      badge: "Social",
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
      sign: "🤞 Friend (Two-Handed)",
      speech: '"My good friend"',
      action: "Both index fingers hooked and interlinked together",
      meaning: "ASL sign for friendship & bond",
      badge: "Social",
      isDual: true,
    },
    {
      sign: "👐 Open / Welcome (Two-Handed)",
      speech: '"Open wide, welcome"',
      action: "Both flat hands held wide apart welcoming outward",
      meaning: "Open wide, welcome, or broad view",
      badge: "Action",
      isDual: true,
    },
    {
      sign: "👏 Deaf Applause (Two-Handed)",
      speech: '"Congratulations! Bravo!"',
      action: "Both hands raised high at head level, waving wrists",
      meaning: "Deaf community applause and celebration",
      badge: "Celebration",
      isDual: true,
    },
    {
      sign: "👍👍 Awesome / Great (Two-Handed)",
      speech: '"Awesome, great job!"',
      action: "Double thumbs-up with both hands simultaneously",
      meaning: "Strong affirmation & double approval",
      badge: "Affirmation",
      isDual: true,
    },
    {
      sign: "✌️✌️ Double Peace (Two-Handed)",
      speech: '"Peace and happiness"',
      action: "Both hands showing Peace sign (V-shape) together",
      meaning: "Double peace, celebration, or joy",
      badge: "Joy",
      isDual: true,
    },
    {
      sign: "🤟🤟 Lots of Love (Two-Handed)",
      speech: '"Sending you so much love!"',
      action: "Both hands showing I Love You sign (Thumb+Index+Pinky)",
      meaning: "Deep love and affection with both hands",
      badge: "Emotion",
      isDual: true,
    },

    // --- SINGLE-HAND SIGNS (13) ---
    {
      sign: "🖐️ Open Palm / Wave",
      speech: '"Hello! Greetings!"',
      action: "Extend all 5 fingers upright facing the camera",
      meaning: "Universal friendly greeting",
      badge: "Greeting",
      isDual: false,
    },
    {
      sign: "💧 Water (ASL W)",
      speech: '"I would like some water please"',
      action: "Extend Index, Middle, Ring (Letter W) near your chin",
      meaning: "ASL sign for water: tapping letter W to chin",
      badge: "Needs",
      isDual: false,
    },
    {
      sign: "🤫 Be Quiet / Shh",
      speech: '"Please be quiet"',
      action: "Extend only Index finger vertically near your mouth",
      meaning: "Universal gesture for silence and listening",
      badge: "Social",
      isDual: false,
    },
    {
      sign: "🤏 A Little Bit",
      speech: '"Just a little bit"',
      action: "Pinch thumb and index close together, other fingers relaxed",
      meaning: "Expressing a small amount or pinch",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "🤟 I Love You",
      speech: '"I love you"',
      action: "Extend Thumb, Index, and Pinky; fold Middle and Ring",
      meaning: "ASL sign expressing care & affection",
      badge: "ASL",
      isDual: false,
    },
    {
      sign: "👍 Thumbs Up",
      speech: '"Yes, good"',
      action: "Extend thumb upwards with all fingers curled into a fist",
      meaning: "Agreement, affirmative, or yes",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "👎 Thumbs Down",
      speech: '"No, bad"',
      action: "Point thumb downwards with all fingers curled into a fist",
      meaning: "Disagreement, negative, or no",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "✌️ Peace / Victory",
      speech: '"Peace"',
      action: "Extend Index and Middle in a V; fold Ring, Pinky, and Thumb",
      meaning: "Peace sign or number 2",
      badge: "Number / Sign",
      isDual: false,
    },
    {
      sign: "👌 OK / All Good",
      speech: '"Everything is okay"',
      action: "Pinch Thumb and Index tips together; keep other 3 fingers open",
      meaning: "Everything is fine / ASL Letter F",
      badge: "Universal",
      isDual: false,
    },
    {
      sign: "🤙 Call Me",
      speech: '"Call me"',
      action: "Extend Thumb and Pinky; keep Index, Middle, Ring curled",
      meaning: "Phone call or relaxed Hawaiian Shaka greeting",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "👆 Letter L / Angle",
      speech: '"Letter L"',
      action: "Extend Thumb and Index at a 90-degree right angle",
      meaning: "ASL Letter L or pointer",
      badge: "ASL Alphabet",
      isDual: false,
    },
    {
      sign: "👉 Pointing",
      speech: '"Look at this"',
      action: "Extend only the Index finger; curl all other fingers",
      meaning: "Attention, direction, or number 1",
      badge: "Everyday",
      isDual: false,
    },
    {
      sign: "✊ Closed Fist",
      speech: '"Stop or wait"',
      action: "Curl all fingers into a firm fist",
      meaning: "Stop, wait, or ASL letter S",
      badge: "Control",
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
            <h2 className="card-title">Sign Language &amp; Gesture Dictionary</h2>
            <p className="stat-label">Real-time recognized signs for both single and dual hands</p>
          </div>
        </div>
        <div className="badge connected">
          <span className="badge-pulse"></span>
          <span>{guideItems.length} Signs Recognized</span>
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
          👐 Both Hands Signs ({dualCount})
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
              📍 <strong>How to Sign:</strong> {item.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
