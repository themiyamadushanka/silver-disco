"use client";

import React from "react";

export default function StatusCard({ healthData, latency, loading, error, onRefresh }) {
  return (
    <div className="card" id="status-inspector-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon">🩺</div>
          <div>
            <h2 className="card-title">Backend Diagnostics</h2>
            <p className="stat-label">FastAPI Health Inspector</p>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={loading}
          id="btn-refresh-health"
        >
          {loading ? "Checking..." : "🔄 Refresh"}
        </button>
      </div>

      <div className="status-grid">
        <div className="status-stat">
          <div className="stat-label">Health Status</div>
          <div className={`stat-value ${healthData?.status === "ok" ? "ok" : ""}`}>
            {healthData?.status ? `● ${healthData.status.toUpperCase()}` : (error ? "OFFLINE" : "CHECKING")}
          </div>
        </div>

        <div className="status-stat">
          <div className="stat-label">API Latency</div>
          <div className="stat-value">
            {latency !== null ? `${latency} ms` : "—"}
          </div>
        </div>

        <div className="status-stat">
          <div className="stat-label">Service Name</div>
          <div className="stat-value">
            {healthData?.service || "FastAPI Backend"}
          </div>
        </div>

        <div className="status-stat">
          <div className="stat-label">API Version</div>
          <div className="stat-value">
            {healthData?.version ? `v${healthData.version}` : "—"}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          color: "#fca5a5",
          fontSize: "0.85rem",
          marginBottom: "16px"
        }}>
          <strong>Connection Error:</strong> Could not connect to FastAPI server at <code>http://127.0.0.1:8000/api/v1/health</code>. Please make sure the backend is running.
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ flex: 1, textDecoration: "none" }}
          id="link-swagger-docs"
        >
          Interactive Swagger Docs ↗
        </a>
        <a
          href="http://127.0.0.1:8000/api/v1/health"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ textDecoration: "none" }}
        >
          Raw JSON ↗
        </a>
      </div>
    </div>
  );
}
