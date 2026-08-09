import React from "react";

const FRIEND_INITIALS = [
  { letter: "K", color: "#12a389" },
  { letter: "A", color: "#f2914a" },
  { letter: "S", color: "#7c6ff2" },
];

export default function AuthMark() {
  return (
    <div className="auth-mark">
      <div className="auth-mark-cluster">
        {FRIEND_INITIALS.map((f, i) => (
          <span
            key={f.letter}
            className="auth-mark-avatar"
            style={{ background: f.color, animationDelay: `${i * 0.12}s` }}
          >
            {f.letter}
          </span>
        ))}
      </div>
      <div className="auth-brand">FriEnds</div>
    </div>
  );
}
