import { useEffect, useRef, useState } from "react";
import type { Blurt as BlurtType } from "../types";
import { letBlurtLinger } from "../api/blurts";
import { useLifespan } from "../hooks/useLifespan";
import BuzzButton from "./Buzz";
import StrikeButton from "./Strike";
import SparkButton from "./Spark";
import Chime from "./Chime";

interface BlurtProps {
  blurt: BlurtType;
  isOwn?: boolean;
  showAuthor?: boolean;
  /** Called once, the moment this Blurt finishes its falling animation and settles as fallen. */
  onFallen?: (id: string) => void;
}

/** A single Blurt — short, tweet-like, falls in 24h unless it's set to linger. */
export default function Blurt({ blurt, isOwn = false, showAuthor = true, onFallen }: BlurtProps) {
  const [showChimes, setShowChimes] = useState(false);
  const [lingering, setLingering] = useState(blurt.lingering);
  const [busy, setBusy] = useState(false);
  const life = useLifespan(blurt.posted_at, lingering ? null : blurt.expires_at, blurt.fallen);
  const wasAliveRef = useRef(!blurt.fallen);
  const [justFell, setJustFell] = useState(false);

  useEffect(() => {
    if (wasAliveRef.current && life.expired) {
      wasAliveRef.current = false;
      setJustFell(true);
      const t = setTimeout(() => onFallen?.(blurt.id), 1100);
      return () => clearTimeout(t);
    }
  }, [life.expired, blurt.id, onFallen]);

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

  const fallen = !lingering && (blurt.fallen || life.expired);
  const cardClass = [
    "post-card",
    justFell ? "is-falling" : fallen ? "is-fallen" : life.isLastMinute ? "is-last-minute" : life.isDying ? "is-dying" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClass}
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: "16px 18px",
        boxShadow: "0 6px 20px rgba(122,15,38,0.03)",
      }}
    >
      {showAuthor && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>@{blurt.author.username}</span>
          {lingering ? (
            <span className="linger-badge">🌿 lingering</span>
          ) : (
            <span className={`life-badge${fallen ? " fallen" : life.isDying ? " dying" : ""}`} style={{ color: fallen ? "var(--ink-muted)" : "var(--cherry)" }}>
              {!fallen && <span className="dot" aria-hidden="true" />}
              {fallen ? "fallen" : life.label}
            </span>
          )}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 15.5, color: "var(--ink)", lineHeight: 1.5 }}>{blurt.body}</p>

      {!lingering && !fallen && (
        <div className="life-bar-track" style={{ marginTop: 10 }}>
          <div
            className={`life-bar-fill${life.isLastMinute ? " last-minute" : life.isDying ? " dying" : ""}`}
            style={{ width: `${Math.max(2, (1 - life.lifeFraction) * 100)}%` }}
          />
        </div>
      )}

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
            title="Stop the 24h countdown and keep this Blurt on your Space forever"
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
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Lingering…" : "Let it linger"}
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
