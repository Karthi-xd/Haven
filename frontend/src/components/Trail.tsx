import { useEffect, useState } from "react";
import { fetchTrail } from "../api/trail";
import type { TrailNode } from "../types";

interface TrailProps {
  authorId: string;
}

/** The Trail — alive Flashes pulse gently, fallen ones freeze in place. */
export default function Trail({ authorId }: TrailProps) {
  const [nodes, setNodes] = useState<TrailNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTrail(authorId)
      .then(setNodes)
      .finally(() => setLoading(false));
  }, [authorId]);

  if (loading) return <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Tracing the trail…</p>;
  if (nodes.length === 0) {
    return <p style={{ color: "var(--ink-muted)", fontSize: 13.5 }}>No Flashes have traveled yet.</p>;
  }

  return (
    <div style={{ position: "relative", padding: "20px 8px" }}>
      <div
        style={{
          position: "absolute",
          left: 28,
          top: 0,
          bottom: 0,
          width: 2,
          background: "linear-gradient(180deg, var(--cherry), rgba(196,24,60,0.1))",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {nodes.map((n) => (
          <div key={n.flash_id} style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                overflow: "hidden",
                border: n.alive ? "2px solid var(--cherry)" : "2px solid var(--line)",
                boxShadow: n.alive ? "0 0 0 4px rgba(196,24,60,0.12)" : "none",
                animation: n.alive ? "flashPulse 2.4s ease-in-out infinite" : "none",
                zIndex: 1,
                background: "#fff",
              }}
            >
              <img src={n.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: n.alive ? "none" : "grayscale(0.5)" }} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
              <div style={{ fontWeight: 700, color: n.alive ? "var(--cherry)" : "var(--ink-muted)" }}>
                {n.alive ? "pulsing" : "frozen"}
              </div>
              <div>{new Date(n.posted_at).toLocaleString()}</div>
              <div>🌸 {n.buzz_count} · 🌺 {n.spark_count}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes flashPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(196,24,60,0.12); }
          50% { box-shadow: 0 0 0 8px rgba(196,24,60,0.05); }
        }
      `}</style>
    </div>
  );
}
