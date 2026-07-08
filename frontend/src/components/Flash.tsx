import { useMemo, useState } from "react";
import type { Flash as FlashType } from "../types";
import BuzzButton from "./Buzz";
import StrikeButton from "./Strike";
import SparkButton from "./Spark";
import Chime from "./Chime";

interface FlashProps {
  flash: FlashType;
  showAuthor?: boolean;
}

function timeRemaining(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "fallen";
  const hrs = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hrs}h ${mins}m left`;
}

/** A single Flash — public by default, falls 24h after it's posted. */
export default function Flash({ flash, showAuthor = true }: FlashProps) {
  const [showChimes, setShowChimes] = useState(false);
  const remaining = useMemo(() => timeRemaining(flash.expires_at), [flash.expires_at]);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(122,15,38,0.04)",
        opacity: flash.fallen ? 0.55 : 1,
      }}
    >
      {showAuthor && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>@{flash.author.username}</span>
          <span style={{ fontSize: 11.5, color: flash.fallen ? "var(--ink-muted)" : "var(--cherry)" }}>
            {flash.fallen ? "fallen" : remaining}
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
