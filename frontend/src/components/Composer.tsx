import { useState, type FormEvent } from "react";
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

const tabStyle = (active: boolean): React.CSSProperties => ({
  border: "none",
  background: active ? "var(--cherry)" : "transparent",
  color: active ? "#fff" : "var(--ink-muted)",
  fontWeight: 700,
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 999,
  cursor: "pointer",
});

export default function Composer({ onFlashCreated, onBlurtCreated, onVaultCreated }: ComposerProps) {
  const [mode, setMode] = useState<Mode>("blurt");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [blurtBody, setBlurtBody] = useState("");
  const [unlocksAt, setUnlocksAt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [followersOnly, setFollowersOnly] = useState(false); // deliberately buried
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        setFile(null);
        setCaption("");
        onFlashCreated?.(p);
      } else {
        if (!file) throw new Error("Choose a photo or video first.");
        if (!unlocksAt) throw new Error("Pick a date and time for it to unlock.");
        const media_url = await uploadFlashMedia(file);
        const media_kind = file.type.startsWith("video") ? "video" : "image";
        await createVault({
          media_url,
          media_kind,
          caption,
          followers_only: followersOnly,
          unlocks_at: new Date(unlocksAt).toISOString(),
        });
        setFile(null);
        setCaption("");
        setUnlocksAt("");
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
        <button type="button" style={tabStyle(mode === "blurt")} onClick={() => setMode("blurt")}>Blurt</button>
        <button type="button" style={tabStyle(mode === "flash")} onClick={() => setMode("flash")}>Flash</button>
        <button type="button" style={tabStyle(mode === "vault")} onClick={() => setMode("vault")}>Vault</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "blurt" && (
          <textarea
            value={blurtBody}
            onChange={(e) => setBlurtBody(e.target.value)}
            maxLength={280}
            placeholder="Blurt something... it falls in 24h unless you let it linger."
            rows={3}
            style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, fontSize: 14, resize: "vertical" }}
          />
        )}

        {(mode === "flash" || mode === "vault") && (
          <>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
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
          {submitting ? "Planting…" : mode === "blurt" ? "Blurt it" : mode === "flash" ? "Let it fall" : "Seal the Vault"}
        </button>
      </form>
    </div>
  );
}
