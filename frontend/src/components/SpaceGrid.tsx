import type { Flash, Blurt } from "../types";

interface SpaceGridProps {
  flashes: Flash[];
  blurts: Blurt[];
  onSelectFlash: (p: Flash) => void;
}

/** Clean, grid-style layout of a Space's Flashes, with lingering Blurts shown as text tiles. */
export default function SpaceGrid({ flashes, blurts, onSelectFlash }: SpaceGridProps) {
  const lingeringBlurts = blurts.filter((w) => w.lingering);

  if (flashes.length === 0 && lingeringBlurts.length === 0) {
    return (
      <p style={{ color: "var(--ink-muted)", fontSize: 13.5, textAlign: "center", padding: "40px 0" }}>
        This Space is quiet for now — Flashes fall after 24h, so only lingering Blurts stay.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 4,
      }}
    >
      {flashes.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelectFlash(p)}
          style={{
            aspectRatio: "1 / 1",
            border: "none",
            padding: 0,
            cursor: "pointer",
            overflow: "hidden",
            position: "relative",
            opacity: p.fallen ? 0.45 : 1,
          }}
        >
          {p.media_kind === "video" ? (
            <video src={p.media_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
          ) : (
            <img src={p.media_url} alt={p.caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {p.fallen && (
            <span style={{ position: "absolute", top: 6, right: 6, fontSize: 11, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 6px", borderRadius: 999 }}>
              fallen
            </span>
          )}
        </button>
      ))}

      {lingeringBlurts.map((w) => (
        <div
          key={w.id}
          style={{
            aspectRatio: "1 / 1",
            background: "linear-gradient(160deg, #fff4f6, #ffe9ec)",
            border: "1px solid var(--line)",
            padding: 12,
            fontSize: 12.5,
            color: "var(--ink)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {w.body}
        </div>
      ))}
    </div>
  );
}
