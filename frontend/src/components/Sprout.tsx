import { useEffect, useState, type FormEvent } from "react";
import { fetchSprouts, createSprout } from "../api/sprouts";
import type { ReactableKind, Sprout as SproutType } from "../types";

interface SproutProps {
  targetKind: ReactableKind;
  targetId: string;
}

/** The comment thread growing off a single Petal or Whisper. */
export default function Sprout({ targetKind, targetId }: SproutProps) {
  const [sprouts, setSprouts] = useState<SproutType[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchSprouts(targetKind, targetId)
      .then(setSprouts)
      .finally(() => setLoading(false));
  }, [targetKind, targetId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const created = await createSprout(targetKind, targetId, trimmed);
      setSprouts((prev) => [...prev, created]);
      setBody("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
      {loading ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>Loading sprouts…</p>
      ) : (
        sprouts.map((s) => (
          <div key={s.id} style={{ display: "flex", gap: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: "var(--cherry)" }}>@{s.author.username}</span>
            <span style={{ color: "var(--ink)" }}>{s.body}</span>
          </div>
        ))
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Grow a Sprout…"
          maxLength={280}
          style={{
            flex: 1,
            border: "1px solid var(--line)",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={posting || !body.trim()}
          style={{
            border: "none",
            background: "var(--cherry)",
            color: "#fff",
            borderRadius: 999,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            opacity: posting || !body.trim() ? 0.6 : 1,
          }}
        >
          Sprout
        </button>
      </form>
    </div>
  );
}
