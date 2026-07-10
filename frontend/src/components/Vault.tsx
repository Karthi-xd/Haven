import { useMemo } from "react";
import type { Vault as VaultType } from "../types";
import { deleteVault } from "../api/vaults";
import { useCountdown } from "../hooks/useLifespan";

interface VaultProps {
  vault: VaultType;
  onDeleted?: (id: string) => void;
  /** Smaller footprint for the horizontal "Sealed Vaults" shelf in the feed. */
  compact?: boolean;
}

const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

/** Tick marks around the dial face — computed once, not per render. */
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * Math.PI * 2 - Math.PI / 2;
  const long = i % 3 === 0;
  const rOuter = 46;
  const rInner = long ? 39 : 42.5;
  return {
    id: i,
    x1: 50 + Math.cos(angle) * rOuter,
    y1: 50 + Math.sin(angle) * rOuter,
    x2: 50 + Math.cos(angle) * rInner,
    y2: 50 + Math.sin(angle) * rInner,
    long,
  };
});

/** 8 sparks that fling outward from the dial the instant a Vault unlocks. */
const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * 360 + (i % 2 === 0 ? 6 : -6);
  return { id: i, angle };
});

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

/** A sealed Vault — hidden from everyone until its unlock time, then it opens into a Flash. */
export default function Vault({ vault, onDeleted, compact = false }: VaultProps) {
  const { reached, fraction, remainingMs } = useCountdown(vault.unlocks_at, vault.created_at);

  const { days, hours, mins, secs } = useMemo(() => {
    const totalSec = Math.floor(remainingMs / 1000);
    return {
      days: Math.floor(totalSec / 86400),
      hours: Math.floor((totalSec % 86400) / 3600),
      mins: Math.floor((totalSec % 3600) / 60),
      secs: totalSec % 60,
    };
  }, [remainingMs]);

  const showDays = days > 0;
  const dialOffset = RING_C * (1 - fraction);

  async function handleDelete() {
    await deleteVault(vault.id);
    onDeleted?.(vault.id);
  }

  return (
    <div className={`vault-card${reached ? " is-opening" : ""}${compact ? " is-compact" : ""}`}>
      <span className="vault-rivet tl" aria-hidden="true" />
      <span className="vault-rivet tr" aria-hidden="true" />
      <span className="vault-rivet bl" aria-hidden="true" />
      <span className="vault-rivet br" aria-hidden="true" />
      <span className="vault-sheen" aria-hidden="true" />

      {!reached && (
        <button type="button" onClick={handleDelete} className="vault-void-btn" title="Remove before it opens">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="vault-dial-wrap">
        <span className="vault-dial-glow" aria-hidden="true" />
        <svg className="vault-dial" viewBox="0 0 100 100">
          <circle className="vault-dial-face" cx="50" cy="50" r="46" />
          <g className="vault-dial-ticks">
            {TICKS.map((t) => (
              <line key={t.id} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.long ? 1.6 : 0.8} />
            ))}
          </g>
          <circle
            className="vault-dial-ring-track"
            cx="50"
            cy="50"
            r={RING_R}
            fill="none"
            strokeWidth="3"
          />
          <circle
            className="vault-dial-ring-fill"
            cx="50"
            cy="50"
            r={RING_R}
            fill="none"
            strokeWidth="3"
            strokeDasharray={RING_C}
            strokeDashoffset={reached ? 0 : dialOffset}
            transform="rotate(-90 50 50)"
          />
          <g className="vault-dial-wheel">
            <circle cx="50" cy="50" r="15" className="wheel-hub" />
            {[0, 60, 120].map((deg) => (
              <rect key={deg} x="48" y="24" width="4" height="20" rx="2" className="wheel-spoke" transform={`rotate(${deg} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="5.5" className="wheel-center" />
          </g>
        </svg>

        {reached && (
          <span className="vault-spark-burst" aria-hidden="true">
            {SPARKS.map((s) => (
              <span key={s.id} className="vault-spark" style={{ ["--sa" as any]: `${s.angle}deg` }} />
            ))}
          </span>
        )}
      </div>

      <div className="vault-status-row">
        <span className="kind-tag is-vault">
          <span aria-hidden="true">🔒</span>Vault
        </span>
        <span className="vault-status-stamp">{reached ? "Opening" : "Sealed"}</span>
        {!compact && (
          <span className="vault-meta-tag">{vault.followers_only ? "Followers only" : "Opens publicly"}</span>
        )}
      </div>

      {!reached ? (
        <div className="vault-digits" aria-label="Time remaining">
          {showDays && (
            <>
              <div className="vault-digit-block">
                <span className="vault-digit-value">{pad2(days)}</span>
                <span className="vault-digit-label">days</span>
              </div>
              <span className="vault-digit-sep">:</span>
            </>
          )}
          <div className="vault-digit-block">
            <span className="vault-digit-value">{pad2(hours)}</span>
            <span className="vault-digit-label">hrs</span>
          </div>
          <span className="vault-digit-sep">:</span>
          <div className="vault-digit-block">
            <span className="vault-digit-value">{pad2(mins)}</span>
            <span className="vault-digit-label">min</span>
          </div>
          <span className="vault-digit-sep">:</span>
          <div className="vault-digit-block">
            <span className="vault-digit-value">{pad2(secs)}</span>
            <span className="vault-digit-label">sec</span>
          </div>
        </div>
      ) : (
        <div className="vault-opening-text">Unlocking into a Flash…</div>
      )}

      <p className="vault-nameplate">{vault.caption || "No caption yet — only you can see this until it opens."}</p>
    </div>
  );
}