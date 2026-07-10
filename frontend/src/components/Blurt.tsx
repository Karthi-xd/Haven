import { useEffect, useRef, useState } from "react";
import type { Blurt as BlurtType } from "../types";
import { letBlurtLinger } from "../api/blurts";
import { useLifespan } from "../hooks/useLifespan";
import BuzzButton from "./Buzz";
import StrikeButton from "./Strike";
import SparkButton from "./Spark";
import Chime from "./Chime";
import "./Feed.css";

interface BlurtProps {
  blurt: BlurtType;
  isOwn?: boolean;
  showAuthor?: boolean;
  /** Called once, the moment this Blurt finishes its falling animation and settles as fallen. */
  onFallen?: (id: string) => void;
}

/** A single Blurt — short, literary fragment. Falls in 24h unless it's set to linger. */
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
    "hv-blurt-card",
    justFell ? "is-falling" : fallen ? "is-fallen" : life.isLastMinute ? "is-last-minute" : life.isDying ? "is-dying" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <span className="hv-blurt-mark" aria-hidden="true">&ldquo;</span>

      {showAuthor && (
        <div className="hv-blurt-head">
          <div className="hv-blurt-author">
            <span className="hv-blurt-avatar" aria-hidden="true">
              <img src={blurt.author.avatar_url} alt="" />
            </span>
            <span className="hv-blurt-username">@{blurt.author.username}</span>
          </div>
          <div className="hv-blurt-meta">
            <span className="hv-kind-tag is-blurt">
              <span aria-hidden="true">💬</span>Blurt
            </span>
            {lingering ? (
              <span className="hv-blurt-linger">🌿 lingering</span>
            ) : (
              <span className={`hv-blurt-life${fallen ? " is-fallen" : ""}`}>
                {!fallen && <span className="hv-dot" aria-hidden="true" />}
                {fallen ? "fallen" : life.label}
              </span>
            )}
          </div>
        </div>
      )}

      <p className="hv-blurt-body">{blurt.body}</p>

      {!lingering && !fallen && (
        <div className="hv-blurt-life-track">
          <div
            className={`hv-blurt-life-fill${life.isLastMinute ? " last-minute" : life.isDying ? " dying" : ""}`}
            style={{ width: `${Math.max(2, (1 - life.lifeFraction) * 100)}%` }}
          />
        </div>
      )}

      <div className="hv-blurt-actions">
        <BuzzButton targetKind="blurt" targetId={blurt.id} count={blurt.buzz_count} />
        <StrikeButton targetKind="blurt" targetId={blurt.id} />
        <SparkButton targetKind="blurt" targetId={blurt.id} count={blurt.spark_count} />
        <button type="button" onClick={() => setShowChimes((v) => !v)} className="feed-btn is-sm is-quiet">
          <span className="feed-btn-icon" aria-hidden="true">🔔</span>
          <span>{blurt.chime_count}</span>
        </button>

        {isOwn && !lingering && (
          <button
            type="button"
            onClick={handleLinger}
            disabled={busy}
            title="Stop the 24h countdown and keep this Blurt on your Space forever"
            className="feed-btn is-sm hv-blurt-linger-btn"
          >
            {busy ? "Lingering…" : "Let it linger"}
          </button>
        )}
      </div>

      {showChimes && (
        <div className="hv-chime-slot">
          <Chime targetKind="blurt" targetId={blurt.id} />
        </div>
      )}
    </div>
  );
}