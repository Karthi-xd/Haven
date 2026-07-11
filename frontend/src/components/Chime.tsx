import { useEffect, useState, type FormEvent } from "react";
import { fetchChimes, createChime } from "../api/chimes";
import type { ReactableKind, Chime as ChimeType } from "../types";

interface ChimeProps {
  targetKind: ReactableKind;
  targetId: string;
}

/** The comment thread growing off a single Blurt. */
export default function Chime({ targetKind, targetId }: ChimeProps) {
  const [chimes, setChimes] = useState<ChimeType[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchChimes(targetKind, targetId)
      .then(setChimes)
      .finally(() => setLoading(false));
  }, [targetKind, targetId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const created = await createChime(targetKind, targetId, trimmed);
      setChimes((prev) => [...prev, created]);
      setBody("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="chime-panel">
      {loading ? (
        <p className="chime-empty">Loading chimes…</p>
      ) : chimes.length === 0 ? (
        <p className="chime-empty">No chimes yet — be the first to say something.</p>
      ) : (
        chimes.map((s) => (
          <div key={s.id} className="chime-row">
            <span className="chime-author">@{s.author.username}</span>
            <span className="chime-body">{s.body}</span>
          </div>
        ))
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a Chime…"
          maxLength={280}
          className="chime-input"
        />
        <button type="submit" disabled={posting || !body.trim()} className="btn is-solid is-sm">
          Chime
        </button>
      </form>
    </div>
  );
}