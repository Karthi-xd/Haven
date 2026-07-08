import { useState } from "react";
import { toggleBuzz } from "../api/reactions";
import type { ReactableKind } from "../types";

interface BuzzProps {
  targetKind: ReactableKind;
  targetId: string;
  count: number;
  active?: boolean;
}

export default function Buzz({ targetKind, targetId, count: initialCount, active: initialActive = false }: BuzzProps) {
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    const next = !active;
    setActive(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await toggleBuzz(targetKind, targetId);
    } catch {
      // roll back on failure
      setActive(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      title="Buzz"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: active ? "var(--cherry)" : "var(--ink-muted)",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        padding: "4px 8px",
        borderRadius: 999,
        transition: "color 0.15s ease",
      }}
    >
      <span aria-hidden="true">{active ? "🌸" : "🤍"}</span>
      <span>{count}</span>
    </button>
  );
}
