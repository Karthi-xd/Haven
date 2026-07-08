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
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(122,15,38,0.04)",
      }}
    >
      {!fallen && (
        <div className="life-bar-track">
          <div
            className={`life-bar-fill${life.isLastMinute ? " last-minute" : life.isDying ? " dying" : ""}`}
            style={{ width: `${Math.max(2, (1 - life.lifeFraction) * 100)}%` }}
          />
        </div>
      )}

      {showAuthor && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>@{flash.author.username}</span>
          <span className={`life-badge${fallen ? " fallen" : life.isDying ? " dying" : ""}`} style={{ color: fallen ? "var(--ink-muted)" : "var(--cherry)" }}>
            {!fallen && <span className="dot" aria-hidden="true" />}
            {fallen ? "fallen" : life.label}
            {flash.followers_only ? " · followers only" : ""}
          </span>
        </div>
      )}

      {flash.media_kind === "video" ? (
        <video src={flash.media_url} controls style={{ width: "100%", maxHeight: 480, objectFit: "cover" }} />
      ) : (
        <img src={flash.media_url} alt={flash.caption} style={{ width: "100%", maxHeight: 480, objectFit: "cover" }} />
      )}

      {flash.caption && <p style={{ padding: "10px 16px 0", fontSize: 14, color: "var(--ink)" }}>{flash.caption}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px 12px" }}>
        <BuzzButton targetKind="flash" targetId={flash.id} count={flash.buzz_count} />
        <StrikeButton targetKind="flash" targetId={flash.id} />
        <SparkButton targetKind="flash" targetId={flash.id} count={flash.spark_count} />
        <button
          type="button"
          onClick={() => setShowChimes((v) => !v)}
          style={{ marginLeft: "auto", border: "none", background: "transparent", color: "var(--ink-muted)", fontSize: 12.5, cursor: "pointer" }}
        >
          🔔 {flash.chime_count} Chimes
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
