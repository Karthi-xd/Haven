import { useState } from "react";
import { toggleSpark } from "../api/reactions";
import type { ReactableKind } from "../types";

interface SparkProps {
  targetKind: ReactableKind;
  targetId: string;
  count: number;
  active?: boolean;
}

/** Rare reaction: "this genuinely changed how I see things." Visually distinct from a Buzz. */
export default function Spark({ targetKind, targetId, count: initialCount, active: initialActive = false }: SparkProps) {
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
      await toggleSpark(targetKind, targetId);
    } catch {
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
      title="Spark — this changed how I see things"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: active ? "1.5px solid var(--cherry-deep)" : "1.5px solid var(--line)",
        background: active ? "rgba(196,24,60,0.08)" : "transparent",
        cursor: "pointer",
        color: active ? "var(--cherry-deep)" : "var(--ink-muted)",
        fontSize: 12.5,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        transition: "all 0.15s ease",
      }}
    >
      <span aria-hidden="true">🌺</span>
      <span>{count > 0 ? count : "Spark"}</span>
    </button>
  );
}
