import { useState } from "react";
import { toggleStrike } from "../api/reactions";
import type { ReactableKind } from "../types";

interface StrikeProps {
  targetKind: ReactableKind;
  targetId: string;
  active?: boolean;
}

/** The negative counterpart to a Buzz — quiet, not punitive. No public count shown. */
export default function Strike({ targetKind, targetId, active: initialActive = false }: StrikeProps) {
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    const next = !active;
    setActive(next);
    try {
      await toggleStrike(targetKind, targetId);
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
      title="Strike"
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
