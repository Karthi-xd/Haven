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
  void targetKind;
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
      className={`btn is-sm is-quiet${active ? " is-active-strike" : ""}`}
      style={{ opacity: active ? 1 : 0.75 }}
    >
      <span className="btn-icon" aria-hidden="true">{active ? "🥀" : "🍂"}</span>
    </button>
  );
}