import type { Flash, Blurt } from "../types";

interface SpaceGridProps {
  flashes: Flash[];
  blurts: Blurt[];
  onSelectFlash: (p: Flash) => void;
}

const ViewIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** Clean, grid-style layout of a Space's Flashes, with lingering Blurts shown as petal tiles. */
export default function SpaceGrid({ flashes, blurts, onSelectFlash }: SpaceGridProps) {
  const lingeringBlurts = blurts.filter((w) => w.lingering);

  if (flashes.length === 0 && lingeringBlurts.length === 0) {
    return (
      <div className="space-grid-empty">
        <span aria-hidden="true">🌸</span>
        This Space is quiet for now — Flashes fall after 24h, so only lingering Blurts stay.
      </div>
    );
  }

  return (
    <div className="space-grid">
      {flashes.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSelectFlash(p)}
          className={`space-tile${p.fallen ? " is-fallen" : ""}`}
          style={{ ["--i" as any]: i }}
          title={p.caption || "View Flash"}
        >
          {p.media_kind === "video" ? (
            <video src={p.media_url} className="space-tile-media" muted />
          ) : (
            <img src={p.media_url} alt={p.caption} className="space-tile-media" />
          )}
          <span className="space-tile-overlay" aria-hidden="true">
            <ViewIcon />
          </span>
          {p.fallen && <span className="space-tile-badge">fallen</span>}
        </button>
      ))}

      {lingeringBlurts.map((w, i) => (
        <div
          key={w.id}
          className="space-tile space-tile-blurt"
          style={{ ["--i" as any]: flashes.length + i }}
        >
          <span className="space-tile-blurt-icon" aria-hidden="true">🌿</span>
          <p className="space-tile-blurt-text">{w.body}</p>
        </div>
      ))}
    </div>
  );
}