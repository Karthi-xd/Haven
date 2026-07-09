import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactElement } from "react";
import { createFlash } from "../api/flashes";
import { createBlurt } from "../api/blurts";
import { createVault } from "../api/vaults";
import { uploadFlashMedia } from "../api/storage";
import type { Flash, Blurt } from "../types";

type Mode = "blurt" | "flash" | "vault";

interface ComposerProps {
  onFlashCreated?: (p: Flash) => void;
  onBlurtCreated?: (w: Blurt) => void;
  onVaultCreated?: () => void;
}

const MODES: Mode[] = ["blurt", "flash", "vault"];
const BLURT_LIMIT = 280;
const MAX_MEDIA_BYTES = 100 * 1024 * 1024; // 100MB

type Ripple = { id: number; x: number; y: number };

/** Fires a short-lived ripple from the click point — the same touch used on the landing CTA. */
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

const MODE_ICONS: Record<Mode, ReactElement> = {
  blurt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5 5.2 15 16 4.2a2 2 0 0 1 2.8 0l1 1a2 2 0 0 1 0 2.8L8.9 18.8Z" />
      <path d="m14 6.2 3.8 3.8" />
    </svg>
  ),
  flash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a2 2 0 0 1 2-2h1.2l1-1.6A1 1 0 0 1 9 4h6a1 1 0 0 1 .86.5L17 6h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </svg>
  ),
  vault: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10.5" width="16" height="9.5" rx="2" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
      <circle cx="12" cy="15" r="1.4" />
    </svg>
  ),
};

const MODE_META: Record<Mode, { label: string; hint: string; cta: string; sendingLabel: string }> = {
  blurt: { label: "Blurt", hint: "Say something quick — it reaches everyone on Haven and falls in 24h unless you let it linger.", cta: "Blurt it", sendingLabel: "Sending" },
  flash: { label: "Flash", hint: "A photo or video, visible to everyone on Haven, gone in 24h.", cta: "Let it fall", sendingLabel: "Uploading" },
  vault: { label: "Vault", hint: "Seal a photo or video away until a future date — it opens into a Flash for everyone, right on schedule.", cta: "Seal the Vault", sendingLabel: "Sealing" },
};

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v10.5M8 8l4-4 4 4" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);
const RemoveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
);

export default function Composer({ onFlashCreated, onBlurtCreated, onVaultCreated }: ComposerProps) {
  const [mode, setMode] = useState<Mode>("blurt");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [blurtBody, setBlurtBody] = useState("");
  const [unlocksAt, setUnlocksAt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [followersOnly, setFollowersOnly] = useState(false); // deliberately buried
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modeRipple = useRipple();
  const submitRipple = useRipple();

  const remaining = BLURT_LIMIT - blurtBody.length;
  const meta = MODE_META[mode];
  const modeIndex = MODES.indexOf(mode);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const minUnlockLocal = useMemo(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000); // at least 5 minutes out
    d.setSeconds(0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  function pickFile(f: File | null) {
    setError("");
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      setError("Please choose a photo or video file.");
      return;
    }
    if (f.size > MAX_MEDIA_BYTES) {
      setError("That file is too big — keep it under 100MB.");
      return;
    }
    setFile(f);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  function resetMediaFields() {
    setFile(null);
    setCaption("");
    setUnlocksAt("");
  }

  function switchMode(m: Mode, e: React.MouseEvent<HTMLButtonElement>) {
    if (m === mode) return;
    modeRipple.trigger(e);
    setMode(m);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "blurt") {
        const trimmed = blurtBody.trim();
        if (!trimmed) throw new Error("Say something first.");
        const w = await createBlurt(trimmed);
        setBlurtBody("");
        onBlurtCreated?.(w);
      } else if (mode === "flash") {
        if (!file) throw new Error("Choose a photo or video first.");
        const media_url = await uploadFlashMedia(file);
        const media_kind = file.type.startsWith("video") ? "video" : "image";
        const p = await createFlash({ media_url, media_kind, caption, followers_only: followersOnly });
        resetMediaFields();
        onFlashCreated?.(p);
      } else {
        if (!file) throw new Error("Choose a photo or video first.");
        if (!unlocksAt) throw new Error("Pick a date and time for it to unlock.");
        if (new Date(unlocksAt).getTime() <= Date.now()) throw new Error("Pick a time in the future.");
        const media_url = await uploadFlashMedia(file);
        const media_kind = file.type.startsWith("video") ? "video" : "image";
        await createVault({
          media_url,
          media_kind,
          caption,
          followers_only: followersOnly,
          unlocks_at: new Date(unlocksAt).toISOString(),
        });
        resetMediaFields();
        onVaultCreated?.();
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`space-card composer-shell mode-${mode}`}>
      {/* ---------- Segmented mode switcher ---------- */}
      <div className="composer-modes" style={{ ["--index" as any]: modeIndex }}>
        <span className="composer-modes-indicator" aria-hidden="true" />
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={(e) => switchMode(m, e)}
            className={`composer-mode-btn${mode === m ? " active" : ""}`}
            aria-pressed={mode === m}
          >
            <span aria-hidden="true">{MODE_ICONS[m]}</span>
            <span className="composer-mode-label">{MODE_META[m].label}</span>
            {modeRipple.layer}
          </button>
        ))}
      </div>

      <p key={`hint-${mode}`} className="composer-hint">{meta.hint}</p>

      <form onSubmit={handleSubmit} key={mode} className="composer-panel">
        {mode === "blurt" && (
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
        )}

        {(mode === "flash" || mode === "vault") && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`composer-dropzone${dragActive ? " is-drag-active" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              {previewUrl ? (
                <div className="composer-preview">
                  <div className="composer-preview-thumb">
                    {file?.type.startsWith("video") ? (
                      <video src={previewUrl} muted />
                    ) : (
                      <img src={previewUrl} alt="preview" />
                    )}
                  </div>
                  <div className="composer-preview-info">
                    <span className="composer-preview-name">{file?.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); pickFile(null); }}
                      className="composer-remove-chip"
                    >
                      <RemoveIcon /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="composer-dropzone-empty">
                  <span className="composer-dropzone-icon"><UploadIcon /></span>
                  Drop a photo or video here, or click to choose one
                </div>
              )}
            </div>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="feed-input"
            />
          </>
        )}

        {mode === "vault" && (
          <label className="composer-field-label">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CalendarIcon /> Unlocks at
            </span>
            <input
              type="datetime-local"
              value={unlocksAt}
              min={minUnlockLocal}
              onChange={(e) => setUnlocksAt(e.target.value)}
              className="composer-datetime"
              style={{ textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}
            />
          </label>
        )}

        {(mode === "flash" || mode === "vault") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`composer-disclosure${showAdvanced ? " is-open" : ""}`}
            >
              More options <ChevronIcon />
            </button>
            {showAdvanced && (
              <div className="composer-advanced">
                <span className="composer-advanced-label">
                  Restrict this {mode === "vault" ? "Vault" : "Flash"} to followers only
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={followersOnly}
                  onClick={() => setFollowersOnly((v) => !v)}
                  className={`composer-switch${followersOnly ? " is-on" : ""}`}
                >
                  <span className="composer-switch-thumb" />
                </button>
              </div>
            )}
          </div>
        )}

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
            {submitting ? <span className="composer-spinner" /> : MODE_ICONS[mode]}
          </span>
          <span className="composer-submit-label">{submitting ? `${meta.sendingLabel}…` : meta.cta}</span>
          {submitRipple.layer}
        </button>
      </form>
    </div>
  );
}
