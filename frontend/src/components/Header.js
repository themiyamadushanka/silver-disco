"use client";

import React from "react";

export default function Header({ apiStatus, latency }) {
  const getBadgeClass = () => {
    if (apiStatus === "connected") return "badge connected";
    if (apiStatus === "connecting") return "badge connecting";
    return "badge disconnected";
  };

  const getStatusText = () => {
    if (apiStatus === "connected") return latency ? `Connected (${latency}ms)` : "Connected";
    if (apiStatus === "connecting") return "Connecting...";
    return "Offline (FastAPI)";
  };

  return (
    <header className="header">
      <div className="container header-content">
        <div className="brand-section">
          <div className="brand-logo">⚡</div>
          <div>
            <h1 className="brand-title">FullStack Starter</h1>
            <p className="brand-subtitle">Next.js (JavaScript) + FastAPI</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="badge">
            <span>Next.js 15 (App Router)</span>
          </div>
          <div className="badge">
            <span>FastAPI (v1)</span>
          </div>
          <div className={getBadgeClass()} id="api-status-badge">
            <span className="badge-pulse"></span>
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
