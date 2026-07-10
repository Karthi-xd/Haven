import { useEffect, useRef, useState } from "react";
import type { Flash as FlashType } from "../types";
import { useLifespan } from "../hooks/useLifespan";
import BuzzButton from "./Buzz";
import StrikeButton from "./Strike";
import SparkButton from "./Spark";
import Chime from "./Chime";
import "./Feed.css";

interface FlashProps {
  flash: FlashType;
  showAuthor?: boolean;
  /** Called once, the moment this Flash finishes its falling animation and settles as fallen. */
  onFallen?: (id: string) => void;
}

/** A single Flash — public by default, full-bleed media that falls 24h after it's posted. */
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
    "hv-flash-card",
    justFell ? "is-falling" : fallen ? "is-fallen" : life.isLastMinute ? "is-last-minute" : life.isDying ? "is-dying" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      {!fallen && (
        <div className="hv-flash-life">
          <div
            className={`hv-flash-life-fill${life.isLastMinute ? " last-minute" : life.isDying ? " dying" : ""}`}
            style={{ width: `${Math.max(2, (1 - life.lifeFraction) * 100)}%` }}
          />
        </div>
      )}

      <div className="hv-flash-media">
        {flash.media_kind === "video" ? (
          <video src={flash.media_url} controls />
        ) : (
          <img src={flash.media_url} alt={flash.caption} />
        )}
        <span className="hv-flash-scrim" aria-hidden="true" />

        {showAuthor ? (
          <div className="hv-flash-header">
            <span className="hv-flash-author">
              <span className="hv-flash-avatar" aria-hidden="true">
                <img src={flash.author.avatar_url} alt="" />
              </span>
              <span className="hv-flash-username">@{flash.author.username}</span>
            </span>
            <span className={`hv-flash-life-badge${fallen ? " is-fallen" : ""}`}>
              <span className="hv-dot" aria-hidden="true" />
              {fallen ? "fallen" : life.label}
              {flash.followers_only ? " · followers" : ""}
            </span>
          </div>
        ) : (
          <span className="hv-flash-kind">
            <span className="hv-kind-tag is-flash">
              <span aria-hidden="true">⚡</span>Flash
            </span>
          </span>
        )}

        {flash.caption && <p className="hv-flash-caption">{flash.caption}</p>}
      </div>

      <div className="hv-flash-actions">
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
          <span>{flash.chime_count}</span>
        </button>
      </div>

      {showChimes && (
        <div className="hv-chime-slot" style={{ padding: "0 12px 12px" }}>
          <Chime targetKind="flash" targetId={flash.id} />
        </div>
      )}
    </div>
  );
}