import { useState } from "react";
import type { Blurt as BlurtType } from "../types";
import { letBlurtLinger } from "../api/blurts";
import BuzzButton from "./Buzz";
import StrikeButton from "./Strike";
import SparkButton from "./Spark";
import Chime from "./Chime";

interface BlurtProps {
  blurt: BlurtType;
  isOwn?: boolean;
  showAuthor?: boolean;
}

/** A single Blurt — short, tweet-like, falls in 24h unless it's set to linger. */
export default function Blurt({ blurt, isOwn = false, showAuthor = true }: BlurtProps) {
  const [showChimes, setShowChimes] = useState(false);
  const [lingering, setLingering] = useState(blurt.lingering);
  const [busy, setBusy] = useState(false);

  async function handleLinger() {
    if (busy || lingering) return;
    setBusy(true);
    try {
      await letBlurtLinger(blurt.id);
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
        opacity: blurt.fallen ? 0.55 : 1,
      }}
    >
      {showAuthor && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>@{blurt.author.username}</span>
          <span style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
            {lingering ? "lingering" : blurt.fallen ? "fallen" : "24h blurt"}
          </span>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 15.5, color: "var(--ink)", lineHeight: 1.5 }}>{blurt.body}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
        <BuzzButton targetKind="blurt" targetId={blurt.id} count={blurt.buzz_count} />
        <StrikeButton targetKind="blurt" targetId={blurt.id} />
        <SparkButton targetKind="blurt" targetId={blurt.id} count={blurt.spark_count} />
        <button
          type="button"
          onClick={() => setShowChimes((v) => !v)}
          style={{ border: "none", background: "transparent", color: "var(--ink-muted)", fontSize: 12.5, cursor: "pointer" }}
        >
          🔔 {blurt.chime_count}
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

      {showChimes && (
        <div style={{ marginTop: 8 }}>
          <Chime targetKind="blurt" targetId={blurt.id} />
        </div>
      )}
    </div>
  );
}
