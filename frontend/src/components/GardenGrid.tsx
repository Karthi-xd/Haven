import type { Petal, Whisper } from "../types";

interface GardenGridProps {
  petals: Petal[];
  whispers: Whisper[];
  onSelectPetal: (p: Petal) => void;
}

/** Clean, grid-style layout of a Garden's Petals, with lingering Whispers shown as text tiles. */
export default function GardenGrid({ petals, whispers, onSelectPetal }: GardenGridProps) {
  const lingeringWhispers = whispers.filter((w) => w.lingering);

  if (petals.length === 0 && lingeringWhispers.length === 0) {
    return (
      <p style={{ color: "var(--ink-muted)", fontSize: 13.5, textAlign: "center", padding: "40px 0" }}>
        This Garden is quiet for now — Petals fall after 24h, so only lingering Whispers stay.
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
      {petals.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelectPetal(p)}
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

      {lingeringWhispers.map((w) => (
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
