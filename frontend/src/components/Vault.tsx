import type { Vault as VaultType } from "../types";
import { deleteVault } from "../api/vaults";
import { useCountdown } from "../hooks/useLifespan";

interface VaultProps {
  vault: VaultType;
  onDeleted?: (id: string) => void;
}

/** A sealed Vault — hidden from everyone until its unlock time, then it opens into a Flash. */
export default function Vault({ vault, onDeleted }: VaultProps) {
  const { label, reached, fraction } = useCountdown(vault.unlocks_at, vault.created_at);

  async function handleDelete() {
    await deleteVault(vault.id);
    onDeleted?.(vault.id);
  }

  return (
    <div className={`vault-card${reached ? " is-opening" : ""}`}>
      <div className="vault-seal">
        <span className="vault-seal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10.5" width="16" height="9.5" rx="2" />
            <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
            <circle cx="12" cy="15" r="1.4" />
          </svg>
        </span>
        <span className="vault-title">{reached ? "Opening…" : "Sealed Vault"}</span>
      </div>

      <p className="vault-caption">
        {vault.caption || "No caption yet."} — only you can see this until it opens.
      </p>

      <div className="vault-countdown">
        {reached ? "Unlocking into a Flash any moment now…" : label}
      </div>

      {!reached && (
        <div className="vault-progress-track">
          <div className="vault-progress-fill" style={{ width: `${Math.max(2, fraction * 100)}%` }} />
        </div>
      )}

      <div className="vault-meta">
        {vault.followers_only ? "Will unlock as followers-only" : "Will unlock publicly, like any Flash"}
      </div>

      {!reached && (
        <button type="button" onClick={handleDelete} className="vault-remove-btn">
          Remove before it opens
        </button>
      )}
    </div>
  );
}
