import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { fetchSpaceBlurts, createBlurt, letBlurtLinger, deleteBlurt } from "../api/blurts";
import { fetchSpaceFlashes, createFlash, letFlashLinger, deleteFlash } from "../api/flashes";
import { releaseDueVaultEntries } from "../api/vault";
import { uploadMoment } from "../api/storage";
import { useLifespan } from "../hooks/useLifespan";
import MediaDrop from "./MediaDrop";
import FlashViewer from "./FlashViewer";
import type { Blurt, Flash } from "../types";

interface TrailProps {
  authorId: string;
  onOpenVault?: () => void;
}

const BLURT_MAX = 280;
const CAPTION_MAX = 200;

type Mode = "blurt" | "flash";
type TrailEntry = ({ kind: "blurt" } & Blurt) | ({ kind: "flash" } & Flash);

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

/** Small gold ring showing a Flash stone's remaining life, mirrored on FlashViewer. */
function FlashRing({ flash }: { flash: Flash }) {
  const life = useLifespan(flash.posted_at, flash.expires_at, flash.fallen);
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <svg className="trail-stone-ring" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="ring-track" cx="20" cy="20" r={r} />
      {!flash.lingering && !flash.fallen && (
        <circle className="ring-fill is-flash" cx="20" cy="20" r={r} strokeDasharray={c} strokeDashoffset={c * life.lifeFraction} />
      )}
    </svg>
  );
}

export default function Trail({ authorId, onOpenVault }: TrailProps) {
  const [blurts, setBlurts] = useState<Blurt[] | null>(null);
  const [flashes, setFlashes] = useState<Flash[] | null>(null);
  const [mode, setMode] = useState<Mode>("blurt");
  const [, setTick] = useState(0);
  const [viewingFlash, setViewingFlash] = useState<Flash | null>(null);

  // Blurt composer state
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Flash composer state
  const [flashFile, setFlashFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [keepForever, setKeepForever] = useState(false);
  const [flashPosting, setFlashPosting] = useState(false);
  const [flashError, setFlashError] = useState("");

  const composerRipple = useRipple();
  const flashRipple = useRipple();

  useEffect(() => {
    releaseDueVaultEntries(authorId).finally(load);
  }, [authorId]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  function load() {
    fetchSpaceBlurts(authorId)
      .then(setBlurts)
      .catch(() => setBlurts([]));
    fetchSpaceFlashes(authorId)
      .then(setFlashes)
      .catch(() => setFlashes([]));
  }

  const remaining = BLURT_MAX - body.length;
  const pct = Math.min(1, body.length / BLURT_MAX);
  const ringR = 8;
  const ringC = 2 * Math.PI * ringR;
  const captionRemaining = CAPTION_MAX - caption.length;

  const entries = useMemo<TrailEntry[] | null>(() => {
    if (blurts === null || flashes === null) return null;
    const b: TrailEntry[] = blurts.map((x) => ({ kind: "blurt", ...x }));
    const f: TrailEntry[] = flashes.map((x) => ({ kind: "flash", ...x }));
    return [...b, ...f].sort((a, z) => new Date(z.posted_at).getTime() - new Date(a.posted_at).getTime());
  }, [blurts, flashes]);

  async function handleBlurtSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    if (trimmed.length > BLURT_MAX) {
      setError(`Keep it under ${BLURT_MAX} characters.`);
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

  async function handleFlashSubmit(e: FormEvent) {
    e.preventDefault();
    if (!flashFile) {
      setFlashError("Drop in a photo or video first.");
      return;
    }
    setFlashError("");
    setFlashPosting(true);
    try {
      const { url, media_kind } = await uploadMoment(flashFile, "flash");
      await createFlash(url, media_kind, caption.trim(), keepForever);
      setFlashFile(null);
      setCaption("");
      setKeepForever(false);
      load();
    } catch (err: any) {
      setFlashError(err?.message || "Couldn't send that Flash. Try again.");
    } finally {
      setFlashPosting(false);
    }
  }

  async function handleLinger(entry: TrailEntry) {
    setBusyId(entry.id);
    try {
      if (entry.kind === "blurt") await letBlurtLinger(entry.id);
      else await letFlashLinger(entry.id);
      load();
      setViewingFlash(null);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(entry: TrailEntry) {
    setBusyId(entry.id);
    try {
      if (entry.kind === "blurt") await deleteBlurt(entry.id);
      else await deleteFlash(entry.id);
      load();
      setViewingFlash(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="space-card composer-shell">
        <div className="trail-mode-toggle" role="tablist" aria-label="What to add to your Trail">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "blurt"}
            className={`trail-mode-tab${mode === "blurt" ? " active" : ""}`}
            onClick={() => setMode("blurt")}
          >
            🌿 Blurt
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "flash"}
            className={`trail-mode-tab is-flash${mode === "flash" ? " active" : ""}`}
            onClick={() => setMode("flash")}
          >
            ⚡ Flash
          </button>
          {onOpenVault && (
            <button type="button" className="trail-vault-link" onClick={onOpenVault}>
              🔒 Seal one for later
            </button>
          )}
        </div>

        {mode === "blurt" ? (
          <form onSubmit={handleBlurtSubmit} className="composer-panel">
            <div className="composer-textarea-wrap">
              <textarea
                className="composer-textarea"
                placeholder="What's passing through your mind right now?"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={BLURT_MAX + 20}
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

            <button type="submit" className="composer-submit" disabled={posting || !body.trim()} onClick={composerRipple.trigger}>
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
        ) : (
          <form onSubmit={handleFlashSubmit} className="composer-panel">
            <MediaDrop file={flashFile} onFile={setFlashFile} accent="flash" />

            <div className="composer-textarea-wrap">
              <input
                className="composer-textarea is-caption"
                placeholder="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={CAPTION_MAX + 20}
              />
            </div>

            <div className="composer-counter-row" style={{ justifyContent: "space-between" }}>
              <label className="flash-forever-toggle">
                <input type="checkbox" checked={keepForever} onChange={(e) => setKeepForever(e.target.checked)} />
                <span>Let it linger from the start</span>
              </label>
              <span className={`composer-counter-text${captionRemaining < 20 ? " is-low" : ""}`}>{captionRemaining}</span>
            </div>

            {flashError && (
              <p className="composer-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                {flashError}
              </p>
            )}

            <button
              type="submit"
              className="composer-submit is-flash"
              disabled={flashPosting || !flashFile}
              onClick={flashRipple.trigger}
            >
              {flashRipple.layer}
              <span className="composer-submit-icon" aria-hidden="true">
                {flashPosting ? (
                  <span className="composer-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2 3 14h7l-1 8 11-14h-8z" />
                  </svg>
                )}
              </span>
              <span className="composer-submit-label">{flashPosting ? "Sending…" : "Set off the flash"}</span>
            </button>
          </form>
        )}
      </div>

      {entries !== null && entries.length === 0 && (
        <div className="space-grid-empty">
          <span aria-hidden="true">🌸</span>
          No trail entries yet. Your first Blurt or Flash will show up here.
        </div>
      )}

      {entries !== null && entries.length > 0 && (
        <div className="trail-path">
          {entries.map((entry, i) => {
            if (entry.kind === "blurt") {
              const left = !entry.lingering ? countdown(entry.expires_at) : null;
              return (
                <div className="trail-path-item" key={`b-${entry.id}`} style={{ ["--i" as any]: i }}>
                  <span className={`trail-node is-blurt${entry.lingering ? " is-lingering" : ""}${entry.fallen ? " is-fallen" : ""}`} aria-hidden="true" />
                  <div className="trail-card">
                    <div className="trail-card-top">
                      <span className="trail-card-time">{timeAgo(entry.posted_at)}</span>
                      {entry.lingering ? (
                        <span className="trail-badge is-lingering">🌿 Lingering</span>
                      ) : entry.fallen ? (
                        <span className="trail-badge is-fallen">🥀 Fallen</span>
                      ) : (
                        <span className="trail-badge is-counting">⏳ {left}</span>
                      )}
                    </div>
                    <p className="trail-card-body">{entry.body}</p>
                    <div className="trail-card-bottom">
                      <div className="trail-card-reactions">
                        <span>🔥 {entry.buzz_count}</span>
                        <span>✨ {entry.spark_count}</span>
                        <span>💬 {entry.chime_count}</span>
                      </div>
                      {!entry.fallen && (
                        <div className="trail-card-actions">
                          {!entry.lingering && (
                            <button type="button" className="btn is-quiet is-sm" disabled={busyId === entry.id} onClick={() => handleLinger(entry)}>
                              Let it linger
                            </button>
                          )}
                          <button type="button" className="btn is-quiet is-sm" disabled={busyId === entry.id} onClick={() => handleDelete(entry)}>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="trail-path-item" key={`f-${entry.id}`} style={{ ["--i" as any]: i }}>
                <span className={`trail-node is-flash${entry.lingering ? " is-lingering" : ""}${entry.fallen ? " is-fallen" : ""}`} aria-hidden="true" />
                <button type="button" className="trail-stone" onClick={() => setViewingFlash(entry)}>
                  {entry.media_kind === "video" ? (
                    <video src={entry.media_url} muted />
                  ) : (
                    <img src={entry.media_url} alt={entry.caption || "Flash"} />
                  )}
                  <FlashRing flash={entry} />
                  <span className="trail-stone-time">{timeAgo(entry.posted_at)}</span>
                  {entry.caption && <span className="trail-stone-caption">{entry.caption}</span>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {viewingFlash && (
        <FlashViewer
          flash={viewingFlash}
          busy={busyId === viewingFlash.id}
          onClose={() => setViewingFlash(null)}
          onLinger={() => handleLinger({ kind: "flash", ...viewingFlash })}
          onDelete={() => handleDelete({ kind: "flash", ...viewingFlash })}
        />
      )}
    </div>
  );
}