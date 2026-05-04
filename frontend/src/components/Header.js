// src/components/Header.js
// ─────────────────────────────────────────────────────────────────────────────
// Top navigation bar showing the app title, connected wallet address,
// and voting status (active / ended).
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";

function Header({ account, isActive, remainingTime }) {
  // Format seconds into mm:ss display
  const formatTime = (seconds) => {
    const s = Number(seconds);
    if (s <= 0) return "00:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Shorten wallet address for display (e.g., 0x1234...abcd)
  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <header className="header">
      <div className="header-left">
        {/* Ballot box emoji as a simple logo */}
        <span className="logo">🗳️</span>
        <h1 className="app-title">DecentraVote</h1>
        <span className="subtitle">Blockchain Voting System</span>
      </div>

      <div className="header-right">
        {/* Voting countdown timer */}
        <div className={`timer-badge ${isActive ? "active" : "ended"}`}>
          {isActive ? (
            <>
              <span className="pulse-dot"></span>
              ⏱ {formatTime(remainingTime)} left
            </>
          ) : (
            "⛔ Voting Ended"
          )}
        </div>

        {/* Connected wallet address */}
        {account && (
          <div className="wallet-badge">
            <span className="wallet-dot">🟢</span>
            {shortenAddress(account)}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
