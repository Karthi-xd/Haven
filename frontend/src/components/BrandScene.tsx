import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import doveImg from "../assets/dove.png";

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
        {/* Dove hovering in place above the wordmark, with a calm resting
            flutter and a soft shadow tracing its own silhouette. Single
            image, single transform per element — no clipped/hinged
            pieces — so the motion is always one continuous, seamless
            flutter. */}
        <div className="pigeon-perch" aria-hidden="true">
          <div className="pigeon-shadow">
            <img src={doveImg} alt="" className="pigeon-img" />
          </div>
        </div>

        <div className="brand-wordmark-inner">Haven</div>
        <span className="brand-underscore">
          <svg viewBox="0 0 80 12" fill="none" aria-hidden="true">
            <path
              d="M4 6 Q 20 10, 40 6 T 76 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="76" cy="6" r="3" fill="var(--cherry-bright)" />
          </svg>
        </span>
        <p className="brand-quote">A place for peace.</p>
      </div>
    </div>
  );
}