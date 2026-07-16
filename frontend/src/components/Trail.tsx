import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { fetchSpaceBlurts, createBlurt, letBlurtLinger, deleteBlurt } from "../api/blurts";
import type { Blurt } from "../types";

interface TrailProps {
  authorId: string;
}

const MAX_LEN = 280;

type Ripple = { id: number; x: number; y: number };

/** Same click-point ripple used on the landing CTA and the Den composer. */
function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  function trigger(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
  }
  const layer = (
    <span className="cta-ripple-layer" aria-hidden="true">
      {ripples.map((r) => (
        <span key={r.id} className="cta-ripple" style={{ left: r.x, top: r.y }} />
      ))}
    </span>
  );
  return { trigger, layer };
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function countdown(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "falling…";
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

export default function Trail({ authorId }: TrailProps) {
  const [blurts, setBlurts] = useState<Blurt[] | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const composerRipple = useRipple();

  useEffect(() => {
    load();
  }, [authorId]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  function load() {
    fetchSpaceBlurts(authorId)
      .then(setBlurts)
      .catch(() => setBlurts([]));
  }

  const remaining = MAX_LEN - body.length;
  const pct = Math.min(1, body.length / MAX_LEN);
  const ringR = 8;
  const ringC = 2 * Math.PI * ringR;

  const sorted = useMemo(
    () => (blurts ?? []).slice().sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()),
    [blurts]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LEN) {
      setError(`Keep it under ${MAX_LEN} characters.`);
      return;
    }
    setError("");
    setPosting(true);
    try {
      await createBlurt(trimmed);
      setBody("");
      load();
    } catch (err: any) {
      setError(err?.message || "Couldn't post that Blurt. Try again.");
    } finally {
      setPosting(false);
    }
  }

  async function handleLinger(id: string) {
    setBusyId(id);
    try {
      await letBlurtLinger(id);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteBlurt(id);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="space-card composer-shell">
        <form onSubmit={handleSubmit} className="composer-panel">
          <div className="composer-textarea-wrap">
            <textarea
              className="composer-textarea"
              placeholder="What's passing through your mind right now?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={MAX_LEN + 20}
              rows={3}
            />
          </div>

          <div className="composer-counter-row">
            <span className={`composer-counter-text${remaining < 20 ? " is-low" : ""}`}>{remaining}</span>
            <svg className="composer-ring" viewBox="0 0 20 20">
              <circle className="ring-track" cx="10" cy="10" r={ringR} />
              <circle
                className="ring-fill"
                cx="10"
                cy="10"
                r={ringR}
                strokeDasharray={ringC}
                strokeDashoffset={ringC * (1 - pct)}
              />
            </svg>
          </div>

          {error && (
            <p className="composer-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="composer-submit"
            disabled={posting || !body.trim()}
            onClick={composerRipple.trigger}
          >
            {composerRipple.layer}
            <span className="composer-submit-icon" aria-hidden="true">
              {posting ? (
                <span className="composer-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                </svg>
              )}
            </span>
            <span className="composer-submit-label">{posting ? "Posting…" : "Set it adrift"}</span>
          </button>
        </form>
      </div>

      {sorted.length === 0 && blurts !== null && (
        <div className="space-grid-empty">
          <span aria-hidden="true">🌸</span>
          No trail entries yet. Your first Blurt will show up here.
        </div>
      )}

      <div className="trail-feed">
        {sorted.map((b, i) => {
          const left = !b.lingering ? countdown(b.expires_at) : null;
          return (
            <div key={b.id} className="trail-card" style={{ ["--i" as any]: i }}>
              <div className="trail-card-top">
                <span className="trail-card-time">{timeAgo(b.posted_at)}</span>
                {b.lingering ? (
                  <span className="trail-badge is-lingering">🌿 Lingering</span>
                ) : b.fallen ? (
                  <span className="trail-badge is-fallen">🥀 Fallen</span>
                ) : (
                  <span className="trail-badge is-counting">⏳ {left}</span>
                )}
              </div>

              <p className="trail-card-body">{b.body}</p>

              <div className="trail-card-bottom">
                <div className="trail-card-reactions">
                  <span>🔥 {b.buzz_count}</span>
                  <span>✨ {b.spark_count}</span>
                  <span>💬 {b.chime_count}</span>
                </div>
                {!b.fallen && (
                  <div className="trail-card-actions">
                    {!b.lingering && (
                      <button
                        type="button"
                        className="btn is-quiet is-sm"
                        disabled={busyId === b.id}
                        onClick={() => handleLinger(b.id)}
                      >
                        Let it linger
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn is-quiet is-sm"
                      disabled={busyId === b.id}
                      onClick={() => handleDelete(b.id)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}