import { useMemo, useState } from "react";
import type { Petal as PetalType } from "../types";
import TouchButton from "./Touch";
import WiltButton from "./Wilt";
import RootbloomButton from "./Rootbloom";
import Sprout from "./Sprout";

interface PetalProps {
  petal: PetalType;
  showAuthor?: boolean;
}

function timeRemaining(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "fallen";
  const hrs = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${hrs}h ${mins}m left`;
}

/** A single Petal — public by default, falls 24h after it's posted. */
export default function Petal({ petal, showAuthor = true }: PetalProps) {
  const [showSprouts, setShowSprouts] = useState(false);
  const remaining = useMemo(() => timeRemaining(petal.expires_at), [petal.expires_at]);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(122,15,38,0.04)",
        opacity: petal.fallen ? 0.55 : 1,
      }}
    >
      {showAuthor && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>@{petal.author.username}</span>
          <span style={{ fontSize: 11.5, color: petal.fallen ? "var(--ink-muted)" : "var(--cherry)" }}>
            {petal.fallen ? "fallen" : remaining}
            {petal.followers_only ? " · followers only" : ""}
          </span>
        </div>
      )}

      {petal.media_kind === "video" ? (
        <video src={petal.media_url} controls style={{ width: "100%", maxHeight: 480, objectFit: "cover" }} />
      ) : (
        <img src={petal.media_url} alt={petal.caption} style={{ width: "100%", maxHeight: 480, objectFit: "cover" }} />
      )}

      {petal.caption && <p style={{ padding: "10px 16px 0", fontSize: 14, color: "var(--ink)" }}>{petal.caption}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px 12px" }}>
        <TouchButton targetKind="petal" targetId={petal.id} count={petal.touch_count} />
        <WiltButton targetKind="petal" targetId={petal.id} />
        <RootbloomButton targetKind="petal" targetId={petal.id} count={petal.rootbloom_count} />
        <button
          type="button"
          onClick={() => setShowSprouts((v) => !v)}
          style={{ marginLeft: "auto", border: "none", background: "transparent", color: "var(--ink-muted)", fontSize: 12.5, cursor: "pointer" }}
        >
          🌱 {petal.sprout_count} Sprouts
        </button>
      </div>

      {showSprouts && (
        <div style={{ padding: "0 16px 16px" }}>
          <Sprout targetKind="petal" targetId={petal.id} />
        </div>
      )}
    </div>
  );
}
