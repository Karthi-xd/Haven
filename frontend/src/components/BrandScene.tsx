import { useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from "react";

interface Flake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  drift: number;
}

interface BrandSceneProps {
  tagline?: string;
}

export default function BrandScene({}: BrandSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [flakes, setFlakes] = useState<Flake[]>([]);

  useEffect(() => {
    const items: Flake[] = [];
    for (let i = 0; i < 16; i++) {
      items.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 5 + Math.random() * 9,
        speed: 10 + Math.random() * 18,
        delay: Math.random() * 16,
        drift: -40 + Math.random() * 80,
      });
    }
    setFlakes(items);
  }, []);

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
      {/* Floating petals */}
      <div className="brand-flakes" aria-hidden="true">
        {flakes.map((f) => (
          <div
            key={f.id}
            className="brand-flake"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              width: f.size,
              height: f.size,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.speed}s`,
              "--drift": `${f.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Glow behind wordmark */}
      <div className="brand-glow" aria-hidden="true" />

      {/* Wordmark */}
      <div
        className="brand-wordmark"
        style={{
          transform: `perspective(700px) rotateX(${tilt.y * -6}deg) rotateY(${tilt.x * 6}deg)`,
        }}
      >
        Haven
      </div>
    </div>
  );
}
