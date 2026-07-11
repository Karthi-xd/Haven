import { useEffect, useState } from "react";

const LINES = [
  "Slow mornings grow the deepest roots.",
  "Something small you plant today may bloom for someone else tomorrow.",
  "Not everything has to last to matter.",
  "Your Space missed you.",
  "Even wilted petals fed the soil.",
  "Come back to yourself for a moment before the day starts.",
  "The path behind you is still there, quietly remembering.",
];

/**
 * A short, warm greeting shown once when the app opens. No action required —
 * it fades in, sits for a moment, then fades away on its own.
 */
export default function Wake() {
  const [visible, setVisible] = useState(true);
  const [line] = useState(() => LINES[Math.floor(Math.random() * LINES.length)]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4200);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 22,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        padding: "12px 22px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.85)",
        border: "1px solid var(--line)",
        boxShadow: "0 8px 24px rgba(196,24,60,0.08)",
        backdropFilter: "blur(8px)",
        fontFamily: "Shippori Mincho, serif",
        fontSize: 14,
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        animation: "wakeFade 4.2s ease forwards",
        pointerEvents: "none",
        maxWidth: "min(90vw, 420px)",
        textAlign: "center",
      }}
    >
      <span aria-hidden="true">💧</span>
      <span>{line}</span>
      <style>{`
        @keyframes wakeFade {
          0% { opacity: 0; transform: translate(-50%, -6px); }
          10% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -6px); }
        }
      `}</style>
    </div>
  );
}