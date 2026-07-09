import { useEffect, useRef, useState } from "react";
import type { Flash as FlashType } from "../types";
import { useLifespan } from "../hooks/useLifespan";
import BuzzButton from "./Buzz";
import StrikeButton from "./Strike";
import SparkButton from "./Spark";
import Chime from "./Chime";

interface FlashProps {
  flash: FlashType;
  showAuthor?: boolean;
  /** Called once, the moment this Flash finishes its falling animation and settles as fallen. */
  onFallen?: (id: string) => void;
}

/** A single Flash — public by default, falls 24h after it's posted. */
export default function Flash({ flash, showAuthor = true, onFallen }: FlashProps) {
  const [showChimes, setShowChimes] = useState(false);
  const life = useLifespan(flash.posted_at, flash.expires_at ?? null, flash.fallen);
  const wasAliveRef = useRef(!flash.fallen);
  const [justFell, setJustFell] = useState(false);

  useEffect(() => {
    if (wasAliveRef.current && life.expired) {
      wasAliveRef.current = false;
      setJustFell(true);
      const t = setTimeout(() => onFallen?.(flash.id), 1100);
      return () => clearTimeout(t);
    }
  }, [life.expired, flash.id, onFallen]);

  const fallen = flash.fallen || life.expired;
  const cardClass = [
    "post-card",
    "post-flash",
    justFell ? "is-falling" : fallen ? "is-fallen" : life.isLastMinute ? "is-last-minute" : life.isDying ? "is-dying" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      {!fallen && (
        <div className="life-bar-track">
          <div
            className={`life-bar-fill${life.isLastMinute ? " last-minute" : life.isDying ? " dying" : ""}`}
            style={{ width: `${Math.max(2, (1 - life.lifeFraction) * 100)}%` }}
          />
        </div>
      )}

      {showAuthor && (
        <div className="post-header">
          <div className="post-author-group">
            <span className="post-avatar" aria-hidden="true">
              <img src={flash.author.avatar_url} alt="" />
            </span>
            <span className="post-author">@{flash.author.username}</span>
          </div>
          <span className={`life-badge${fallen ? "" : life.isDying ? " dying" : ""}`} style={{ color: fallen ? "var(--ink-muted)" : "var(--cherry)" }}>
            {!fallen && <span className="dot" aria-hidden="true" />}
            {fallen ? "fallen" : life.label}
            {flash.followers_only ? " · followers only" : ""}
          </span>
        </div>
      )}

      <div className="flash-media-wrap">
        {flash.media_kind === "video" ? (
          <video src={flash.media_url} controls />
        ) : (
          <img src={flash.media_url} alt={flash.caption} />
        )}
        {flash.caption && <p className="flash-caption-overlay">{flash.caption}</p>}
      </div>

      <div className="post-actions">
        <BuzzButton targetKind="flash" targetId={flash.id} count={flash.buzz_count} />
        <StrikeButton targetKind="flash" targetId={flash.id} />
        <SparkButton targetKind="flash" targetId={flash.id} count={flash.spark_count} />
        <button
          type="button"
          onClick={() => setShowChimes((v) => !v)}
          className="feed-btn is-sm is-quiet"
          style={{ marginLeft: "auto" }}
        >
          <span className="feed-btn-icon" aria-hidden="true">🔔</span>
          <span>{flash.chime_count} Chimes</span>
        </button>
      </div>

      {showChimes && (
        <div style={{ padding: "0 16px 16px" }}>
          <Chime targetKind="flash" targetId={flash.id} />
        </div>
      )}
    </div>
  );
}