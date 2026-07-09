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
      className={`feed-btn is-sm${active ? " is-solid" : ""}${pop ? " is-popping" : ""}`}
    >
      <span className="feed-btn-icon" aria-hidden="true">{active ? "🌸" : "🤍"}</span>
      <span>{count}</span>
    </button>
  );
}
