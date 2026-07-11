import type { Blurt } from "../types";

interface SpaceGridProps {
  blurts: Blurt[];
}

export default function SpaceGrid({ blurts }: SpaceGridProps) {
  const lingeringBlurts = blurts.filter((w) => w.lingering);

  if (lingeringBlurts.length === 0) {
    return (
      <div className="space-grid-empty">
        <span aria-hidden="true">🌸</span>
        This Space is quiet for now.
      </div>
    );
  }

  return (
    <div className="space-grid">
      {lingeringBlurts.map((w, i) => (
        <div
          key={w.id}
          className="space-tile space-tile-blurt"
          style={{ ["--i" as any]: i }}
        >
          <span className="space-tile-blurt-icon" aria-hidden="true">🌿</span>
          <p className="space-tile-blurt-text">{w.body}</p>
        </div>
      ))}
    </div>
  );
}
