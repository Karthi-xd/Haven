import { useState } from "react";
import type { Whisper as WhisperType } from "../types";
import { letWhisperLinger } from "../api/whispers";
import TouchButton from "./Touch";
import WiltButton from "./Wilt";
import RootbloomButton from "./Rootbloom";
import Sprout from "./Sprout";

interface WhisperProps {
  whisper: WhisperType;
  isOwn?: boolean;
  showAuthor?: boolean;
}

/** A single Whisper — short, tweet-like, falls in 24h unless it's set to linger. */
export default function Whisper({ whisper, isOwn = false, showAuthor = true }: WhisperProps) {
  const [showSprouts, setShowSprouts] = useState(false);
  const [lingering, setLingering] = useState(whisper.lingering);
  const [busy, setBusy] = useState(false);

  async function handleLinger() {
    if (busy || lingering) return;
    setBusy(true);
    try {
      await letWhisperLinger(whisper.id);
      setLingering(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: "16px 18px",
        boxShadow: "0 6px 20px rgba(122,15,38,0.03)",
        opacity: whisper.fallen ? 0.55 : 1,
      }}
    >
      {showAuthor && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>@{whisper.author.username}</span>
          <span style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
            {lingering ? "lingering" : whisper.fallen ? "fallen" : "24h whisper"}
          </span>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 15.5, color: "var(--ink)", lineHeight: 1.5 }}>{whisper.body}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
        <TouchButton targetKind="whisper" targetId={whisper.id} count={whisper.touch_count} />
        <WiltButton targetKind="whisper" targetId={whisper.id} />
        <RootbloomButton targetKind="whisper" targetId={whisper.id} count={whisper.rootbloom_count} />
        <button
          type="button"
          onClick={() => setShowSprouts((v) => !v)}
          style={{ border: "none", background: "transparent", color: "var(--ink-muted)", fontSize: 12.5, cursor: "pointer" }}
        >
          🌱 {whisper.sprout_count}
        </button>

        {isOwn && !lingering && (
          <button
            type="button"
            onClick={handleLinger}
            disabled={busy}
            style={{
              marginLeft: "auto",
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--cherry)",
              fontSize: 11.5,
              fontWeight: 600,
              borderRadius: 999,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            Let it linger
          </button>
        )}
      </div>

      {showSprouts && (
        <div style={{ marginTop: 8 }}>
          <Sprout targetKind="whisper" targetId={whisper.id} />
        </div>
      )}
    </div>
  );
}
