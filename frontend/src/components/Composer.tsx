import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
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

const tabStyle = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  background: active ? "var(--cherry)" : "transparent",
  color: active ? "#fff" : "var(--ink-muted)",
  fontWeight: 700,
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 999,
  cursor: "pointer",
  transition: "background 0.2s ease, color 0.2s ease",
});

const MODE_META: Record<Mode, { icon: string; label: string; hint: string; cta: string }> = {
  blurt: { icon: "✍️", label: "Blurt", hint: "Say something quick — it falls in 24h unless you let it linger.", cta: "Blurt it" },
  flash: { icon: "📸", label: "Flash", hint: "A photo or video, visible to everyone, gone in 24h.", cta: "Let it fall" },
  vault: { icon: "🌑", label: "Vault", hint: "Seal a photo or video away until a future date, then it opens like any Flash.", cta: "Seal the Vault" },
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
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 20,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {(["blurt", "flash", "vault"] as Mode[]).map((m) => (
          <button key={m} type="button" style={tabStyle(mode === m)} onClick={() => { setMode(m); setError(""); }}>
            <span aria-hidden="true">{MODE_META[m].icon}</span> {MODE_META[m].label}
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
              style={{
                border: `1.5px dashed ${dragActive ? "var(--cherry)" : "var(--line)"}`,
                borderRadius: 16,
                padding: previewUrl ? 10 : 24,
                textAlign: "center",
                cursor: "pointer",
                background: dragActive ? "var(--blush-soft)" : "transparent",
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}
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
                <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  📎 Drop a photo or video here, or click to choose one
                </span>
              )}
            </div>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "10px 14px", fontSize: 14 }}
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

        <button
          type="submit"
          disabled={submitting}
          style={{
            alignSelf: "flex-start",
            border: "none",
            background: "var(--cherry)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13.5,
            padding: "10px 22px",
            borderRadius: 999,
            cursor: "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Planting…" : meta.cta}
        </button>
      </form>
    </div>
  );
}
