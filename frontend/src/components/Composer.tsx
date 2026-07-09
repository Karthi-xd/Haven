import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactElement } from "react";
import { createFlash } from "../api/flashes";
import { createBlurt } from "../api/blurts";
import { createVault } from "../api/vaults";
import { uploadFlashMedia } from "../api/storage";
import type { Flash, Blurt } from "../types";

type Mode = "flash" | "blurt" | "vault";

interface ComposerProps {
  onFlashCreated?: (p: Flash) => void;
  onBlurtCreated?: (w: Blurt) => void;
  onVaultCreated?: () => void;
}

const BLURT_LIMIT = 280;
const MAX_MEDIA_BYTES = 100 * 1024 * 1024; // 100MB

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
  blurt: { label: "Blurt", hint: "Say something quick — it falls in 24h unless you let it linger.", cta: "Blurt it", sendingLabel: "Sending…" },
  flash: { label: "Flash", hint: "A photo or video, visible to everyone, gone in 24h.", cta: "Let it fall", sendingLabel: "Uploading…" },
  vault: { label: "Vault", hint: "Seal a photo or video away until a future date, then it opens like any Flash.", cta: "Seal the Vault", sendingLabel: "Sealing…" },
};

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

  const remaining = BLURT_LIMIT - blurtBody.length;
  const meta = MODE_META[mode];

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
    <div
      className="space-card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {(["blurt", "flash", "vault"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`composer-tab${mode === m ? " active" : ""}`}
            onClick={() => { setMode(m); setError(""); }}
          >
            <span aria-hidden="true">{MODE_ICONS[m]}</span> {MODE_META[m].label}
          </button>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>{meta.hint}</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "blurt" && (
          <div>
            <textarea
              value={blurtBody}
              onChange={(e) => setBlurtBody(e.target.value.slice(0, BLURT_LIMIT))}
              maxLength={BLURT_LIMIT}
              placeholder="Blurt something…"
              rows={3}
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 14, padding: 12, fontSize: 14, resize: "vertical", fontFamily: "inherit" }}
            />
            <div style={{ textAlign: "right", fontSize: 11, color: remaining < 20 ? "var(--cherry)" : "var(--ink-muted)", marginTop: 4 }}>
              {remaining} left
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
              style={{ padding: previewUrl ? 10 : 24, textAlign: "center" }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              {previewUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {file?.type.startsWith("video") ? (
                    <video src={previewUrl} style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 10 }} muted />
                  ) : (
                    <img src={previewUrl} alt="preview" style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 10 }} />
                  )}
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{file?.name}</div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); pickFile(null); }}
                      style={{ border: "none", background: "transparent", color: "var(--cherry)", fontSize: 12, textDecoration: "underline", cursor: "pointer", padding: 0, marginTop: 4 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-muted)" }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 4v10.5M8 8l4-4 4 4" />
                    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                  </svg>
                  Drop a photo or video here, or click to choose one
                </span>
              )}
            </div>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="feed-input"
              style={{ fontSize: 14, padding: "10px 14px" }}
            />
          </>
        )}

        {mode === "vault" && (
          <label style={{ fontSize: 12.5, color: "var(--ink-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
            Unlocks at
            <input
              type="datetime-local"
              value={unlocksAt}
              min={minUnlockLocal}
              onChange={(e) => setUnlocksAt(e.target.value)}
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 12px", fontSize: 14 }}
            />
          </label>
        )}

        {(mode === "flash" || mode === "vault") && (
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              style={{ border: "none", background: "transparent", color: "var(--ink-muted)", fontSize: 11.5, textDecoration: "underline", cursor: "pointer", padding: 0 }}
            >
              {showAdvanced ? "Hide" : "More options"}
            </button>
            {showAdvanced && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-muted)", marginTop: 6 }}>
                <input type="checkbox" checked={followersOnly} onChange={(e) => setFollowersOnly(e.target.checked)} />
                Restrict this {mode === "vault" ? "Vault" : "Flash"} to followers only
              </label>
            )}
          </div>
        )}

        {error && <p style={{ color: "var(--cherry-deep)", fontSize: 12.5, margin: 0 }}>{error}</p>}

        <button type="submit" disabled={submitting} className="btn btn-primary composer-submit" style={{ alignSelf: "flex-start" }}>
          {submitting ? meta.sendingLabel : meta.cta}
        </button>
      </form>
    </div>
  );
}
