import { useEffect, useMemo, useState } from "react";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface Lifespan {
  /** ms remaining until it falls/unlocks. 0 once expired. */
  remainingMs: number;
  /** 0 = freshly posted, 1 = right at the moment it falls. */
  lifeFraction: number;
  /** Short human label, e.g. "6h 12m left" or "42s left". */
  label: string;
  /** True once remainingMs has hit 0. */
  expired: boolean;
  /** True in the final stretch of life — used to intensify the fade. */
  isDying: boolean;
  /** True inside the very last minute — used for the falling flourish. */
  isLastMinute: boolean;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "fallen";
  if (ms < MINUTE) return `${Math.ceil(ms / SECOND)}s left`;
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m left`;
  const hrs = Math.floor(ms / HOUR);
  const mins = Math.floor((ms % HOUR) / MINUTE);
  return `${hrs}h ${mins}m left`;
}

/**
 * Ticks down the life of a Blurt toward its expires_at, giving back
 * everything the UI needs to visually "fade" a post as its 24h window closes.
 *
 * Pass `expiresAt = null` for a permanent (lingering) Blurt — it always comes
 * back fresh/alive and never dies.
 */
export function useLifespan(postedAt: string, expiresAt: string | null, alreadyFallen = false): Lifespan {
  const postedMs = useMemo(() => new Date(postedAt).getTime(), [postedAt]);
  const expiresMs = useMemo(() => (expiresAt ? new Date(expiresAt).getTime() : null), [expiresAt]);
  const totalMs = expiresMs ? Math.max(expiresMs - postedMs, 1) : null;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresMs) return; // permanent — nothing to tick
    // Tick every second so the last minute feels alive.
    const id = setInterval(() => setNow(Date.now()), SECOND);
    return () => clearInterval(id);
  }, [expiresMs]);

  if (!expiresMs || !totalMs) {
    return { remainingMs: Infinity, lifeFraction: 0, label: "lingering", expired: false, isDying: false, isLastMinute: false };
  }

  const remainingMs = Math.max(expiresMs - now, 0);
  const expired = alreadyFallen || remainingMs <= 0;
  const lifeFraction = Math.min(1, Math.max(0, 1 - remainingMs / totalMs));

  return {
    remainingMs,
    lifeFraction,
    label: formatRemaining(remainingMs),
    expired,
    isDying: !expired && remainingMs < HOUR,
    isLastMinute: !expired && remainingMs < MINUTE,
  };
}

/** Simpler one-way countdown. */
export function useCountdown(targetAt: string, startAt?: string) {
  const targetMs = useMemo(() => new Date(targetAt).getTime(), [targetAt]);
  const startMs = useMemo(() => (startAt ? new Date(startAt).getTime() : null), [startAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), SECOND);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(targetMs - now, 0);
  const reached = remainingMs <= 0;
  /** 0 = just sealed, 1 = right at the unlock moment. Only meaningful if startAt was passed. */
  const fraction = startMs
    ? Math.min(1, Math.max(0, 1 - remainingMs / Math.max(targetMs - startMs, 1)))
    : 0;

  let label: string;
  if (reached) {
    label = "opening…";
  } else if (remainingMs > DAY) {
    const days = Math.floor(remainingMs / DAY);
    const hrs = Math.floor((remainingMs % DAY) / HOUR);
    label = `unlocks in ${days}d ${hrs}h`;
  } else if (remainingMs > HOUR) {
    const hrs = Math.floor(remainingMs / HOUR);
    const mins = Math.floor((remainingMs % HOUR) / MINUTE);
    label = `unlocks in ${hrs}h ${mins}m`;
  } else if (remainingMs > MINUTE) {
    const mins = Math.floor(remainingMs / MINUTE);
    const secs = Math.floor((remainingMs % MINUTE) / SECOND);
    label = `unlocks in ${mins}m ${secs}s`;
  } else {
    label = `unlocks in ${Math.ceil(remainingMs / SECOND)}s`;
  }

  return { remainingMs, reached, label, fraction };
}
