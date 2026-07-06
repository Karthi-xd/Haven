import { useRef } from "react";

interface StormPetal {
  size: number;
  lane: number;
  delay: number;
  speed: number;
  rot: number;
  rotSpeed: number;
  wobbleAmp: number;
  wobbleFreq: number;
  wobblePhase: number;
  color: string;
}

const PALETTE = ["#FF3B5C", "#C4183C", "#E8547A", "#FFE3E8", "#9B1233"];

function tracePetal(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.62, -size * 0.78, size * 0.98, -size * 0.18, size * 0.9, size * 0.32);
  ctx.bezierCurveTo(size * 0.84, size * 0.66, size * 0.42, size * 0.9, size * 0.12, size * 0.98);
  ctx.quadraticCurveTo(0, size * 1.08, -size * 0.12, size * 0.98);
  ctx.bezierCurveTo(-size * 0.42, size * 0.9, -size * 0.84, size * 0.66, -size * 0.9, size * 0.32);
  ctx.bezierCurveTo(-size * 0.98, -size * 0.18, -size * 0.62, -size * 0.78, 0, -size);
  ctx.closePath();
}

export function usePetalTransition(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  overlayRef: React.RefObject<HTMLDivElement | null>
) {
  const rafRef = useRef(0);

  function sizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function launch(originEl: HTMLElement, onCovered: () => void, onDone?: () => void) {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !overlay || !ctx) {
      onCovered();
      onDone?.();
      return;
    }

    sizeCanvas();
    const rect = originEl.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const diag = Math.sqrt(vw * vw + vh * vh);

    overlay.classList.add("active");

    const windAngle = (Math.random() - 0.5) * 0.5;
    const dirX0 = Math.cos(windAngle);
    const dirY0 = Math.sin(windAngle) + 0.12;
    const len = Math.sqrt(dirX0 * dirX0 + dirY0 * dirY0);
    const dirX = dirX0 / len;
    const dirY = dirY0 / len;
    const perpX = -dirY;
    const perpY = dirX;

    const travel = diag * 1.7;
    const startBack = diag * 0.85;
    const totalLife = 1200;
    const swapAt = 560;
    let start: number | null = null;
    let swapped = false;

    const petalCount = 70;
    const stormPetals: StormPetal[] = Array.from({ length: petalCount }, () => ({
      size: 8 + Math.random() * 12,
      lane: (Math.random() - 0.5) * diag * 1.15,
      delay: Math.random() * 480,
      speed: 0.85 + Math.random() * 0.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: 6 + Math.random() * 9,
      wobbleAmp: 18 + Math.random() * 34,
      wobbleFreq: 0.005 + Math.random() * 0.012,
      wobblePhase: Math.random() * Math.PI * 2,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    }));

    function drawStormPetal(x: number, y: number, rot: number, size: number, alpha: number, color: string) {
      ctx!.save();
      ctx!.translate(x, y);
      ctx!.rotate(rot);
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle = color;
      tracePetal(ctx!, size);
      ctx!.fill();
      ctx!.restore();
    }

    function frame(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;

      ctx!.clearRect(0, 0, vw, vh);

      for (const sp of stormPetals) {
        const local = (elapsed - sp.delay) * sp.speed;
        if (local <= 0) continue;
        const life = totalLife - sp.delay;
        const p = local / (life > 0 ? life : totalLife);
        if (p > 1.05) continue;
        const travelled = -startBack + travel * Math.min(1, p);
        let x = originX + dirX * travelled + perpX * sp.lane;
        let y = originY + dirY * travelled + perpY * sp.lane;
        const wobble = Math.sin(local * sp.wobbleFreq + sp.wobblePhase) * sp.wobbleAmp;
        x += perpX * wobble;
        y += perpY * wobble;
        const rot = sp.rot + local * 0.01 * sp.rotSpeed;
        const alpha = p < 0.06 ? p / 0.06 : p > 0.88 ? Math.max(0, 1 - (p - 0.88) / 0.12) : 1;
        drawStormPetal(x, y, rot, sp.size, alpha * 0.92, sp.color);
      }

      if (!swapped && elapsed >= swapAt) {
        swapped = true;
        onCovered();
      }

      if (elapsed < totalLife) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        ctx!.clearRect(0, 0, vw, vh);
        overlay!.classList.remove("active");
        onDone?.();
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  function cancel() {
    cancelAnimationFrame(rafRef.current);
  }

  return { launch, cancel, sizeCanvas };
}
