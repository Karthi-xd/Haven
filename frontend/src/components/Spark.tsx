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

  const [pop, setPop] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    const next = !active;
    setActive(next);
    setCount((c) => c + (next ? 1 : -1));
    setPop(true);
    setTimeout(() => setPop(false), 400);
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
      className={`feed-btn is-sm${active ? " is-solid" : ""}${pop ? " is-popping" : ""}`}
    >
      <span className="feed-btn-icon" aria-hidden="true">🌺</span>
      <span>{count > 0 ? count : "Spark"}</span>
    </button>
  );
}
