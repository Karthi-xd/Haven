import { useEffect, useState } from "react";
import { fetchTrail } from "../api/trail";
import type { TrailNode } from "../types";

interface TrailProps {
  authorId: string;
}

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
    return <p style={{ color: "var(--ink-muted)", fontSize: 13.5 }}>Nothing here yet.</p>;
  }

  return (
    <div style={{ position: "relative", padding: "20px 8px" }}>
      {nodes.map((n) => (
        <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div>{new Date(n.posted_at).toLocaleString()}</div>
          <div>🌸 {n.buzz_count} · 🌺 {n.spark_count}</div>
        </div>
      ))}
    </div>
  );
}
