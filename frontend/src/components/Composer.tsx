import { useState, type FormEvent } from "react";
import { createBlurt } from "../api/blurts";
import type { Blurt } from "../types";

interface ComposerProps {
  onBlurtCreated?: (w: Blurt) => void;
}

const BLURT_LIMIT = 280;

type Ripple = { id: number; x: number; y: number };

function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  function trigger(e: React.MouseEvent<HTMLElement>) {
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

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v10.5M8 8l4-4 4 4" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </svg>
);

export default function Composer({ onBlurtCreated }: ComposerProps) {
  const [blurtBody, setBlurtBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitRipple = useRipple();

  const remaining = BLURT_LIMIT - blurtBody.length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const trimmed = blurtBody.trim();
      if (!trimmed) throw new Error("Say something first.");
      const w = await createBlurt(trimmed);
      setBlurtBody("");
      onBlurtCreated?.(w);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-card composer-shell">
      <form onSubmit={handleSubmit} className="composer-panel">
        <div className="composer-textarea-wrap">
          <textarea
            value={blurtBody}
            onChange={(e) => setBlurtBody(e.target.value.slice(0, BLURT_LIMIT))}
            maxLength={BLURT_LIMIT}
            placeholder="Blurt something everyone on Haven will see…"
            rows={3}
            className="composer-textarea"
            autoFocus
          />
          <div className="composer-counter-row">
            <span className={`composer-counter-text${remaining < 20 ? " is-low" : ""}`}>{remaining} left</span>
            <svg className="composer-ring" viewBox="0 0 24 24">
              <circle className="ring-track" cx="12" cy="12" r="10" />
              <circle
                className="ring-fill"
                cx="12"
                cy="12"
                r="10"
                strokeDasharray={2 * Math.PI * 10}
                strokeDashoffset={2 * Math.PI * 10 * (1 - blurtBody.length / BLURT_LIMIT)}
                style={{ stroke: remaining < 20 ? "var(--cherry-deep)" : "var(--cherry)" }}
              />
            </svg>
          </div>
        </div>

        {error && (
          <p className="composer-error">
            <AlertIcon /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="composer-submit"
          onClick={(e) => submitRipple.trigger(e)}
        >
          <span className="composer-submit-icon" aria-hidden="true">
            {submitting ? <span className="composer-spinner" /> : <UploadIcon />}
          </span>
          <span className="composer-submit-label">{submitting ? "Sending…" : "Blurt it"}</span>
          {submitRipple.layer}
        </button>
      </form>
    </div>
  );
}