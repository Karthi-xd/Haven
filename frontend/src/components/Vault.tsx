import { useEffect, useMemo, useState, type FormEvent } from "react";
import { fetchMyVault, sealVaultEntry, breakSealEarly, releaseDueVaultEntries } from "../api/vault";
import { uploadMoment } from "../api/storage";
import { useCountdown } from "../hooks/useLifespan";
import MediaDrop from "./MediaDrop";
import type { VaultEntry } from "../types";

interface VaultProps {
  authorId: string;
}

const CAPTION_MAX = 200;

function localDatetimeMin(): string {
  // datetime-local needs "YYYY-MM-DDTHH:mm" in local time, at least 5 min out.
  const d = new Date(Date.now() + 5 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** One sealed envelope, ticking down toward the moment its wax cracks open. */
function VaultSeal({ entry, onBreak, busy }: { entry: VaultEntry; onBreak: (id: string) => void; busy: boolean }) {
  const { label, fraction, reached } = useCountdown(entry.scheduled_for, entry.sealed_at);

  return (
    <div className={`vault-seal${reached ? " is-opening" : ""}`} style={{ ["--seal-progress" as any]: fraction }}>
      <div className="vault-seal-wax">
        <span className="vault-seal-wax-half is-left" />
        <span className="vault-seal-wax-half is-right" />
        <span className="vault-seal-glyph" aria-hidden="true">⛯</span>
      </div>
      <div className="vault-seal-body">
        <p className="vault-seal-caption">{entry.caption || "A sealed moment"}</p>
        <span className="vault-seal-countdown">{label}</span>
        <span className="vault-seal-date">opens {fullDate(entry.scheduled_for)}</span>
        {entry.permanent && <span className="vault-seal-tag">will linger once opened</span>}
      </div>
      <button
        type="button"
        className="btn is-quiet is-sm vault-seal-break"
        disabled={busy}
        onClick={() => onBreak(entry.id)}
      >
        Break seal
      </button>
    </div>
  );
}

export default function Vault({ authorId }: VaultProps) {
  const [entries, setEntries] = useState<VaultEntry[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduledFor, setScheduledFor] = useState(localDatetimeMin());
  const [permanent, setPermanent] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    releaseDueVaultEntries(authorId).finally(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId]);

  function load() {
    fetchMyVault(authorId)
      .then(setEntries)
      .catch(() => setEntries([]));
  }

  const sealed = useMemo(
    () => (entries ?? []).filter((e) => !e.released).sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()),
    [entries]
  );

  const captionRemaining = CAPTION_MAX - caption.length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a photo or video to seal away first.");
      return;
    }
    const target = new Date(scheduledFor);
    if (isNaN(target.getTime()) || target.getTime() <= Date.now()) {
      setError("Pick a time in the future.");
      return;
    }
    setError("");
    setPosting(true);
    try {
      const { url, media_kind } = await uploadMoment(file, "vault");
      await sealVaultEntry(url, media_kind, caption.trim(), target.toISOString(), permanent);
      setFile(null);
      setCaption("");
      setPermanent(false);
      setScheduledFor(localDatetimeMin());
      load();
    } catch (err: any) {
      setError(err?.message || "Couldn't seal that away. Try again.");
    } finally {
      setPosting(false);
    }
  }

  async function handleBreak(id: string) {
    setBusyId(id);
    try {
      await breakSealEarly(id);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="space-card composer-shell is-vault">
        <form onSubmit={handleSubmit} className="composer-panel">
          <MediaDrop file={file} onFile={setFile} accent="vault" label="Drop the photo or video you want to seal away" />

          <div className="composer-textarea-wrap">
            <input
              className="composer-textarea is-caption"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={CAPTION_MAX + 20}
            />
          </div>

          <div className="vault-schedule-row">
            <label className="vault-schedule-field">
              <span>Opens at</span>
              <input
                type="datetime-local"
                className="vault-datetime"
                value={scheduledFor}
                min={localDatetimeMin()}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </label>
            <label className="flash-forever-toggle is-vault">
              <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />
              <span>Let it linger once it opens</span>
            </label>
          </div>

          <div className="composer-counter-row" style={{ justifyContent: "flex-end" }}>
            <span className={`composer-counter-text${captionRemaining < 20 ? " is-low" : ""}`}>{captionRemaining}</span>
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

          <button type="submit" className="composer-submit is-vault" disabled={posting || !file}>
            <span className="composer-submit-icon" aria-hidden="true">
              {posting ? (
                <span className="composer-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
                  <path d="M3 7l9 5 9-5M12 12v10" />
                </svg>
              )}
            </span>
            <span className="composer-submit-label">{posting ? "Sealing…" : "Seal it away"}</span>
          </button>
        </form>
      </div>

      {sealed.length === 0 && entries !== null && (
        <div className="space-grid-empty is-vault">
          <span aria-hidden="true">🔒</span>
          The Vault is quiet. Seal a Flash away and it'll wait here until its moment comes.
        </div>
      )}

      {sealed.length > 0 && (
        <div className="vault-seal-list">
          {sealed.map((entry) => (
            <VaultSeal key={entry.id} entry={entry} onBreak={handleBreak} busy={busyId === entry.id} />
          ))}
        </div>
      )}
    </div>
  );
}