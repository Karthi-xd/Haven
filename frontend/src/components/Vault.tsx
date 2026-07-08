import { useMemo } from "react";
import type { Vault as VaultType } from "../types";
import { deleteVault } from "../api/vaults";

interface VaultProps {
  vault: VaultType;
  onDeleted?: (id: string) => void;
}

function untilUnlock(unlocksAt: string) {
  const ms = new Date(unlocksAt).getTime() - Date.now();
  if (ms <= 0) return "unlocking soon";
  const days = Math.floor(ms / 86_400_000);
  const hrs = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `unlocks in ${days}d ${hrs}h`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `unlocks in ${hrs}h ${mins}m`;
}

/** A sealed Vault — hidden from everyone until its unlock time, then it opens into a Flash. */
export default function Vault({ vault, onDeleted }: VaultProps) {
  const label = useMemo(() => untilUnlock(vault.unlocks_at), [vault.unlocks_at]);

  async function handleDelete() {
    await deleteVault(vault.id);
    onDeleted?.(vault.id);
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px dashed var(--cherry)",
        background: "linear-gradient(160deg, #fff4f6, #ffe9ec)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }} aria-hidden="true">🌑</span>
        <strong style={{ color: "var(--cherry-deep)", fontSize: 14 }}>Sealed Vault</strong>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
        {vault.caption || "No caption yet."} — only you can see this until it opens.
      </p>
      <div style={{ fontSize: 12.5, color: "var(--cherry)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
        {vault.followers_only ? "Will unlock as followers-only" : "Will unlock publicly, like any Flash"}
      </div>
      <button
        type="button"
        onClick={handleDelete}
        style={{
          alignSelf: "flex-start",
          border: "none",
          background: "transparent",
          color: "var(--ink-muted)",
          fontSize: 12,
          textDecoration: "underline",
          cursor: "pointer",
          padding: 0,
        }}
      >
        Remove before it opens
      </button>
    </div>
  );
}
