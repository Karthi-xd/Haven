import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface BrandSceneProps {
  tagline?: string;
}

export default function BrandScene({}: BrandSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rx = (e.clientX - rect.left) / rect.width - 0.5;
    const ry = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: rx, y: ry });
  }

  return (
    <div
      ref={containerRef}
      className="brand-scene"
      onPointerMove={handlePointerMove}
    >
      {/* Glow behind wordmark */}
      <div className="brand-glow" aria-hidden="true" />

      {/* Wordmark */}
      <div
        className="brand-wordmark"
        style={{
          transform: `perspective(700px) rotateX(${tilt.y * -6}deg) rotateY(${tilt.x * 6}deg)`,
        }}
      >
        {/* Pigeon shadow that flies in */}
        <div className="pigeon-shadow" aria-hidden="true">
          <svg viewBox="0 0 120 80" fill="white" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="58" cy="38" rx="26" ry="15" />
            <circle cx="34" cy="24" r="9" />
            <polygon points="80,30 106,26 102,40 82,38" />
            <polygon points="26,24 16,25 26,28" />
            <path d="M48 26 Q56 18 70 20 Q74 24 70 30 Q60 34 48 26Z" />
          </svg>
        </div>

        <div className="brand-wordmark-inner">
          Haven
        </div>
        <span className="brand-underscore">
          <svg viewBox="0 0 80 12" fill="none" aria-hidden="true">
            <path d="M4 6 Q 20 10, 40 6 T 76 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="76" cy="6" r="3" fill="var(--cherry-bright)" />
          </svg>
        </span>
        <p className="brand-quote">A place for peace.</p>
      </div>
    </div>
  );
}
