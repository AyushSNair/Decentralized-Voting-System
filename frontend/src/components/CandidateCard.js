// src/components/CandidateCard.js
// ─────────────────────────────────────────────────────────────────────────────
// Renders a single candidate's card with their name, vote count,
// a vote button, and a visual progress bar.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";

function CandidateCard({ candidate, totalVotes, onVote, hasVoted, isActive, votingFor }) {
  // Calculate this candidate's % of total votes
  const percentage =
    totalVotes > 0 ? Math.round((Number(candidate.voteCount) / totalVotes) * 100) : 0;

  // Is this specific card being processed (transaction pending)?
  const isVotingForThis = votingFor === Number(candidate.id);

  // Generate a consistent avatar color based on candidate ID
  const avatarColors = ["#6c63ff", "#ff6584", "#43b89c", "#f9a825", "#ef5350", "#29b6f6"];
  const avatarColor = avatarColors[Number(candidate.id) % avatarColors.length];

  // Get candidate initials for the avatar
  const initials = candidate.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`candidate-card ${isVotingForThis ? "voting" : ""}`}>
      {/* Candidate Avatar */}
      <div className="avatar" style={{ backgroundColor: avatarColor }}>
        {initials}
      </div>

      {/* Name and vote info */}
      <div className="candidate-info">
        <h3 className="candidate-name">{candidate.name}</h3>

        {/* Progress bar showing vote share */}
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${percentage}%`, backgroundColor: avatarColor }}
          ></div>
        </div>


      </div>

      {/* Vote Button */}
      <button
        className="vote-btn"
        style={{ borderColor: avatarColor, color: avatarColor }}
        onClick={() => onVote(Number(candidate.id))}
        disabled={hasVoted || !isActive || isVotingForThis}
        title={
          hasVoted
            ? "You already voted"
            : !isActive
            ? "Voting has ended"
            : `Vote for ${candidate.name}`
        }
      >
        {isVotingForThis ? (
          <span className="spinner">⏳</span>
        ) : hasVoted ? (
          "✓ Voted"
        ) : (
          "Vote"
        )}
      </button>
    </div>
  );
}

export default CandidateCard;
