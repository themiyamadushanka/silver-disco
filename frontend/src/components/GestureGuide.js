"use client";

import React from "react";

export default function GestureGuide() {
  const guideItems = [
    {
      sign: "🖐️ HELLO",
      speech: '"Hello! How are you?"',
      action: "Open palm facing camera, all fingers spread upright",
      category: "Greeting",
      hands: "Single Hand",
    },
    {
      sign: "🙏 THANK_YOU",
      speech: '"Thank you very much"',
      action: "Flat open hand moving from chin/chest outward",
      category: "Courtesy",
      hands: "Single / Both",
    },
    {
      sign: "👍 YES",
      speech: '"Yes, I agree"',
      action: "Firm fist with thumb extended upright (thumbs-up)",
      category: "Affirmation",
      hands: "Single Hand",
    },
    {
      sign: "👎 NO",
      speech: '"No, I disagree"',
      action: "Fist with thumb pointing downwards in rejection",
      category: "Negation",
      hands: "Single Hand",
    },
    {
      sign: "🤲 PLEASE",
      speech: '"Please, could you help?"',
      action: "Flat open hand pressed gently against chest",
      category: "Courtesy",
      hands: "Single Hand",
    },
    {
      sign: "🤟 I_LOVE_YOU",
      speech: '"I love you"',
      action: "Extend Thumb, Index, and Pinky; fold Middle and Ring",
      category: "Emotion",
      hands: "Single Hand",
    },
    {
      sign: "✌️ PEACE",
      speech: '"Peace / Number 2"',
      action: "Extend Index and Middle in V-shape; fold other fingers",
      category: "Greeting",
      hands: "Single Hand",
    },
    {
      sign: "👌 OK",
      speech: '"Everything is fine / All good"',
      action: "Pinch Thumb and Index tips into circle, extend other 3 fingers",
      category: "Agreement",
      hands: "Single Hand",
    },
    {
      sign: "🛑 STOP",
      speech: '"Please stop or wait"',
      action: "Solid closed fist held firmly up indicating stop or wait",
      category: "Directive",
      hands: "Single Hand",
    },
    {
      sign: "🆘 HELP",
      speech: '"I need help please"',
      action: "Left hand flat palm up, Right hand in thumbs-up fist resting on top",
      category: "Emergency",
      hands: "Two-Handed",
    },
    {
      sign: "👉 POINTING",
      speech: '"Look at that"',
      action: "Index finger extended forward directing attention, others curled",
      category: "Directive",
      hands: "Single Hand",
    },
    {
      sign: "🤝 FRIEND",
      speech: '"We are friends"',
      action: "Both index fingers curved into hooks linked together at center",
      category: "Social",
      hands: "Two-Handed",
    },
    {
      sign: "🤜🤛 TOGETHER",
      speech: '"Let us work together"',
      action: "Both hands in thumbs-up fists touching side-by-side at knuckles",
      category: "Social",
      hands: "Two-Handed",
    },
    {
      sign: "🏠 HOUSE",
      speech: '"Home / House"',
      action: "Fingertips of both flat hands touching at an apex forming a roof",
      category: "Object",
      hands: "Two-Handed",
    },
    {
      sign: "👐 OPEN",
      speech: '"Open the door / Welcome"',
      action: "Both flat hands held apart, palms facing inward opening a wide gate",
      category: "Action",
      hands: "Two-Handed",
    },
    {
      sign: "🚪 CLOSE",
      speech: '"Close / Shut"',
      action: "Both flat hands brought together until palms touch flat",
      category: "Action",
      hands: "Two-Handed",
    },
    {
      sign: "📖 BOOK",
      speech: '"Book / Reading"',
      action: "Both flat hands together palms-up, opening outward like a book",
      category: "Object",
      hands: "Two-Handed",
    },
    {
      sign: "👏 APPLAUD",
      speech: '"Congratulations / Well done!"',
      action: "Both hands raised with open palms waving or clapping",
      category: "Social",
      hands: "Two-Handed",
    },
    {
      sign: "🤲 PRAY_RESPECT",
      speech: '"Respect / Thankfulness"',
      action: "Both palms pressed flat together at chest in namaste/prayer pose",
      category: "Courtesy",
      hands: "Two-Handed",
    },
    {
      sign: "➕ MORE",
      speech: '"I would like more please"',
      action: "Fingertips of both flattened-O hands tapping together repeatedly",
      category: "Action",
      hands: "Two-Handed",
    },
  ];

  return (
    <div className="card guide-card" id="gesture-guide-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon">📖</div>
          <div>
            <h2 className="card-title">ASL CSV Dataset Reference (300 Samples • 20 Signs)</h2>
            <p className="stat-label">Model: sign_language_dual_hands_dataset.csv • High accuracy 3D joint matching</p>
          </div>
        </div>
        <div className="badge connected">
          <span className="badge-pulse"></span>
          <span>{guideItems.length} Signs Trained in CSV</span>
        </div>
      </div>

      <div className="guide-grid">
        {guideItems.map((item, idx) => (
          <div key={idx} className="guide-item-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span className="guide-sign-title">{item.sign}</span>
              <span className="guide-badge">{item.hands}</span>
            </div>
            <div className="guide-speech-text">
              🗣️ Translates to: <strong>{item.speech}</strong>
            </div>
            <div className="guide-action-text" style={{ marginTop: "4px" }}>
              📍 <strong>Pose:</strong> {item.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
