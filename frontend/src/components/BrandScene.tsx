import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface Orb {
  id: string;
  icon: string;
  label: string;
  homeX: number; // percentage across the panel
  homeY: number;
  size: number;
  hue: string;
  delay: number;
}

const ORBS: Orb[] = [
  { id: "communities", icon: "🌸", label: "Discover communities for anything you care about", homeX: 22, homeY: 24, size: 68, hue: "linear-gradient(135deg, var(--cherry-bright), var(--cherry))", delay: 0 },
  { id: "vote", icon: "🗳️", label: "Vote on posts and comments that matter", homeX: 76, homeY: 20, size: 54, hue: "linear-gradient(135deg, var(--cherry), var(--cherry-deep))", delay: 0.6 },
  { id: "threads", icon: "💬", label: "Threaded discussions with real depth", homeX: 80, homeY: 66, size: 62, hue: "linear-gradient(135deg, var(--cherry-deep), var(--cherry))", delay: 1.2 },
  { id: "mod", icon: "🛡️", label: "Community-led moderation, no algorithm bias", homeX: 24, homeY: 72, size: 52, hue: "linear-gradient(135deg, var(--cherry-bright), var(--cherry-deep))", delay: 1.8 },
];

// how far (px) an orb is allowed to be dragged from its home spot
const DRAG_RADIUS = 90;

interface BrandSceneProps {
  wordmark?: string;
  tagline: string;
}

export default function BrandScene({ wordmark = "Haven", tagline }: BrandSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeOrb, setActiveOrb] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  function handlePanelMove(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: relX, y: relY });
  }

  function startDrag(orb: Orb, e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const current = offsets[orb.id] ?? { x: 0, y: 0 };
    dragRef.current = { id: orb.id, startX: e.clientX, startY: e.clientY, origX: current.x, origY: current.y };
    setActiveOrb(orb.id);
  }

  function onDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const { id, startX, startY, origX, origY } = dragRef.current;
    let dx = origX + (e.clientX - startX);
    let dy = origY + (e.clientY - startY);
    const dist = Math.hypot(dx, dy);
    if (dist > DRAG_RADIUS) {
      const scale = DRAG_RADIUS / dist;
      dx *= scale;
      dy *= scale;
    }
    setOffsets((p) => ({ ...p, [id]: { x: dx, y: dy } }));
  }

  function endDrag() {
    if (!dragRef.current) return;
    const { id } = dragRef.current;
    dragRef.current = null;
    setActiveOrb(null);
    // spring back home
    setOffsets((p) => ({ ...p, [id]: { x: 0, y: 0 } }));
  }

  return (
    <div ref={containerRef} className="brand-scene" onPointerMove={handlePanelMove}>
      <div
        className="brand-scene-wordmark"
        style={{ transform: `perspective(700px) rotateX(${tilt.y * -8}deg) rotateY(${tilt.x * 8}deg)` }}
      >
        {wordmark}
      </div>
      <p className="brand-scene-tagline">{tagline}</p>
      <p className="brand-scene-hint">Drag the petals ✦</p>

      <div className="brand-scene-orbs">
        {ORBS.map((orb) => {
          const offset = offsets[orb.id] ?? { x: 0, y: 0 };
          const parallax = {
            x: tilt.x * (orb.size / 2.2),
            y: tilt.y * (orb.size / 2.2),
          };
          const dragging = activeOrb === orb.id;
          return (
            <div
              key={orb.id}
              className={`brand-orb-hit${dragging ? " dragging" : ""}`}
              style={{
                left: `${orb.homeX}%`,
                top: `${orb.homeY}%`,
                width: orb.size,
                height: orb.size,
                transform: `translate(-50%, -50%) translate(${offset.x + parallax.x}px, ${offset.y + parallax.y}px)`,
                transition: dragging ? "none" : "transform 0.7s var(--ease-out)",
              }}
              onPointerDown={(e) => startDrag(orb, e)}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <div className="brand-orb-inner" style={{ background: orb.hue, animationDelay: `${orb.delay}s` }}>
                {orb.icon}
              </div>
              <span className="brand-orb-label">{orb.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
