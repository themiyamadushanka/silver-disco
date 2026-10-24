"use client";

import React from "react";

export default function PositionTracker({ positions }) {
  if (!positions) {
    return (
      <div className="card position-tracker-card" id="position-tracker-card">
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon">📍</div>
            <div>
              <h2 className="card-title">3D Position Tracker</h2>
              <p className="stat-label">Real-Time Joint Coordinates</p>
            </div>
          </div>
          <span className="badge">Awaiting Hand...</span>
        </div>
        <div className="waiting-placeholder">
          <span className="waiting-icon">✋</span>
          <p>No hand detected yet.</p>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Show your hand to the camera to see real-time 3D landmark coordinates.
          </span>
        </div>
      </div>
    );
  }

  const { handedness = "Right", fingers = {}, wrist = {}, metrics = {} } = positions;

  const keyPoints = [
    { name: "Wrist (Root)", color: "#10b981", data: wrist, extended: null },
    { name: "Thumb Tip", color: "#f59e0b", data: fingers?.thumb?.tip, extended: fingers?.thumb?.extended },
    { name: "Index Tip", color: "#06b6d4", data: fingers?.index?.tip, extended: fingers?.index?.extended },
    { name: "Middle Tip", color: "#6366f1", data: fingers?.middle?.tip, extended: fingers?.middle?.extended },
    { name: "Ring Tip", color: "#a855f7", data: fingers?.ring?.tip, extended: fingers?.ring?.extended },
    { name: "Pinky Tip", color: "#f43f5e", data: fingers?.pinky?.tip, extended: fingers?.pinky?.extended },
  ];

  return (
    <div className="card position-tracker-card" id="position-tracker-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon">📍</div>
          <div>
            <h2 className="card-title">3D Position Tracker</h2>
            <p className="stat-label">Real-Time Joint Coordinates</p>
          </div>
        </div>
        <div className="badge connected">
          <span className="badge-pulse"></span>
          <span>{handedness} Hand Active</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="tracker-metrics-grid">
        <div className="tracker-metric-box">
          <span className="stat-label">Extended Fingers</span>
          <span className="stat-value">{metrics.extendedCount} / 5</span>
        </div>
        <div className="tracker-metric-box">
          <span className="stat-label">Thumb-Index Pinch</span>
          <span className="stat-value">{metrics.pinchThumbIndex}%</span>
        </div>
        <div className="tracker-metric-box">
          <span className="stat-label">Pinch State</span>
          <span className={`stat-value ${metrics.isPinching ? "ok" : ""}`}>
            {metrics.isPinching ? "🤏 PINCHING" : "OPEN"}
          </span>
        </div>
        <div className="tracker-metric-box">
          <span className="stat-label">Palm Span</span>
          <span className="stat-value">{metrics.palmSpan}%</span>
        </div>
      </div>

      {/* Pinch Progress Bar */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span className="stat-label">Pinch Sensitivity</span>
          <span style={{ fontSize: "0.8rem", color: metrics.isPinching ? "#34d399" : "var(--text-secondary)" }}>
            {metrics.isPinching ? "Triggered (Touch)" : `${metrics.pinchThumbIndex}% Gap`}
          </span>
        </div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${metrics.isPinching ? "pinch-active" : ""}`}
            style={{ width: `${Math.min(100, Math.max(5, 100 - metrics.pinchThumbIndex))}%` }}
          ></div>
        </div>
      </div>

      {/* 3D Coordinates Table */}
      <div className="table-responsive">
        <table className="coords-table">
          <thead>
            <tr>
              <th>Joint</th>
              <th>Status</th>
              <th>X</th>
              <th>Y</th>
              <th>Z (Depth)</th>
            </tr>
          </thead>
          <tbody>
            {keyPoints.map((pt, idx) => (
              <tr key={idx}>
                <td>
                  <span className="joint-label">
                    <span className="joint-dot" style={{ background: pt.color }}></span>
                    {pt.name}
                  </span>
                </td>
                <td>
                  {pt.extended === null ? (
                    <span className="joint-badge root">Base</span>
                  ) : pt.extended ? (
                    <span className="joint-badge ext">Extended</span>
                  ) : (
                    <span className="joint-badge curl">Folded</span>
                  )}
                </td>
                <td className="coord-val">{pt.data?.x?.toFixed(3) || "0.000"}</td>
                <td className="coord-val">{pt.data?.y?.toFixed(3) || "0.000"}</td>
                <td className="coord-val depth">{pt.data?.z?.toFixed(3) || "0.000"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
