import { useState } from "react";
import { toggleWilt } from "../api/reactions";
import type { ReactableKind } from "../types";

interface WiltProps {
  targetKind: ReactableKind;
  targetId: string;
  active?: boolean;
}

/** The negative counterpart to a Touch — quiet, not punitive. No public count shown. */
export default function Wilt({ targetKind, targetId, active: initialActive = false }: WiltProps) {
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    const next = !active;
    setActive(next);
    try {
      await toggleWilt(targetKind, targetId);
    } catch {
      setActive(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      title="Wilt"
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: active ? "#8a6b52" : "var(--ink-muted)",
        fontSize: 15,
        padding: "4px 8px",
        borderRadius: 999,
        opacity: active ? 1 : 0.65,
      }}
    >
      <span aria-hidden="true">{active ? "🥀" : "🍂"}</span>
    </button>
  );
}
