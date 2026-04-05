// src/components/ResultsPage.js
// ─────────────────────────────────────────────────────────────────────────────
// Shown automatically when the voting timer reaches zero.
// Displays: winner announcement, vote breakdown with animated bars.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";

// Avatar colours — same palette as CandidateCard
const AVATAR_COLORS = ["#6c63ff", "#ef5350", "#43b89c", "#ff9800", "#26c6da"];

function ResultsPage({ candidates, totalVotes, hasVoted }) {
  const [animate, setAnimate] = useState(false);

  // Trigger bar animations shortly after mount
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!candidates.length) return null;

  // Sort by votes descending to find winner
  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const winner = sorted[0];
  const isTie  = sorted.length > 1 && sorted[0].voteCount === sorted[1].voteCount;

  const initials = (name) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const pct = (votes) =>
    totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

  return (
    <div className="results-page">
      {/* ── Winner Banner ── */}
      <div className="winner-banner">
        <div className="winner-trophy">🏆</div>
        {isTie ? (
          <>
            <h2 className="winner-title">It's a Tie!</h2>
            <p className="winner-subtitle">
              {sorted
                .filter((c) => c.voteCount === winner.voteCount)
                .map((c) => c.name)
                .join(" & ")}{" "}
              — {winner.voteCount} vote{winner.voteCount !== 1 ? "s" : ""} each
            </p>
          </>
        ) : (
          <>
            <h2 className="winner-title">
              {winner.name} Wins!
            </h2>
            <p className="winner-subtitle">
              {winner.voteCount} vote{winner.voteCount !== 1 ? "s" : ""} · {pct(winner.voteCount)}% of total
            </p>
          </>
        )}
        <div className="results-meta">
          <span>📊 {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>👥 {candidates.length} candidates</span>
          {hasVoted && <><span>·</span><span>✅ You participated</span></>}
        </div>
      </div>

      {/* ── Breakdown ── */}
      <div className="results-breakdown">
        <h3 className="breakdown-title">Full Results</h3>
        <div className="results-list">
          {sorted.map((c, idx) => {
            const isWinner = !isTie && c.id === winner.id;
            return (
              <div
                key={c.id}
                className={`result-row ${isWinner ? "result-row--winner" : ""}`}
              >
                {/* Rank */}
                <span className="result-rank">#{idx + 1}</span>

                {/* Avatar */}
                <div
                  className="result-avatar"
                  style={{ background: AVATAR_COLORS[c.id % AVATAR_COLORS.length] }}
                >
                  {initials(c.name)}
                </div>

                {/* Name + bar */}
                <div className="result-info">
                  <div className="result-name-row">
                    <span className="result-name">{c.name}</span>
                    {isWinner && <span className="result-crown">👑</span>}
                    <span className="result-pct">{pct(c.voteCount)}%</span>
                  </div>
                  <div className="result-bar-track">
                    <div
                      className="result-bar-fill"
                      style={{
                        width: animate ? `${pct(c.voteCount)}%` : "0%",
                        background: isWinner
                          ? "linear-gradient(90deg, #6c63ff, #43b89c)"
                          : "var(--surface2)",
                        borderColor: AVATAR_COLORS[c.id % AVATAR_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="result-votes">
                    {c.voteCount} vote{c.voteCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;
