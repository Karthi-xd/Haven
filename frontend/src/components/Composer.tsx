import { useState, type FormEvent } from "react";
import { createPetal } from "../api/petals";
import { createWhisper } from "../api/whispers";
import { createBloom } from "../api/blooms";
import { uploadPetalMedia } from "../api/storage";
import type { Petal, Whisper } from "../types";

type Mode = "petal" | "whisper" | "bloom";

interface ComposerProps {
  onPetalCreated?: (p: Petal) => void;
  onWhisperCreated?: (w: Whisper) => void;
  onBloomCreated?: () => void;
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

export default function Composer({ onPetalCreated, onWhisperCreated, onBloomCreated }: ComposerProps) {
  const [mode, setMode] = useState<Mode>("whisper");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [whisperBody, setWhisperBody] = useState("");
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
      if (mode === "whisper") {
        const trimmed = whisperBody.trim();
        if (!trimmed) throw new Error("Say something first.");
        const w = await createWhisper(trimmed);
        setWhisperBody("");
        onWhisperCreated?.(w);
      } else if (mode === "petal") {
        if (!file) throw new Error("Choose a photo or video first.");
        const media_url = await uploadPetalMedia(file);
        const media_kind = file.type.startsWith("video") ? "video" : "image";
        const p = await createPetal({ media_url, media_kind, caption, followers_only: followersOnly });
        setFile(null);
        setCaption("");
        onPetalCreated?.(p);
      } else {
        if (!file) throw new Error("Choose a photo or video first.");
        if (!unlocksAt) throw new Error("Pick a date and time for it to unlock.");
        const media_url = await uploadPetalMedia(file);
        const media_kind = file.type.startsWith("video") ? "video" : "image";
        await createBloom({
          media_url,
          media_kind,
          caption,
          followers_only: followersOnly,
          unlocks_at: new Date(unlocksAt).toISOString(),
        });
        setFile(null);
        setCaption("");
        setUnlocksAt("");
        onBloomCreated?.();
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
        <button type="button" style={tabStyle(mode === "whisper")} onClick={() => setMode("whisper")}>Whisper</button>
        <button type="button" style={tabStyle(mode === "petal")} onClick={() => setMode("petal")}>Petal</button>
        <button type="button" style={tabStyle(mode === "bloom")} onClick={() => setMode("bloom")}>Bloom</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "whisper" && (
          <textarea
            value={whisperBody}
            onChange={(e) => setWhisperBody(e.target.value)}
            maxLength={280}
            placeholder="Whisper something... it falls in 24h unless you let it linger."
            rows={3}
            style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 12, fontSize: 14, resize: "vertical" }}
          />
        )}

        {(mode === "petal" || mode === "bloom") && (
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

        {mode === "bloom" && (
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

        {(mode === "petal" || mode === "bloom") && (
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
                Restrict this {mode === "bloom" ? "Bloom" : "Petal"} to followers only
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
          {submitting ? "Planting…" : mode === "whisper" ? "Whisper it" : mode === "petal" ? "Let it fall" : "Seal the Bloom"}
        </button>
      </form>
    </div>
  );
}
