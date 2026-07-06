import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  rot: number;
  rotSpeed: number;
  color: string;
  opacity: number;
  t: number;
}

const COLORS = ["#C4183C", "#FF3B5C", "#FFE3E8", "#E8547A"];

export default function PetalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let petals: Petal[] = [];
    let raf = 0;

    function makePetal(initial: boolean): Petal {
      return {
        x: Math.random() * W,
        y: initial ? Math.random() * H : -20,
        size: 5 + Math.random() * 7,
        speedY: 0.4 + Math.random() * 0.7,
        speedX: 0.3 + Math.random() * 0.5,
        swayAmp: 20 + Math.random() * 40,
        swayFreq: 0.006 + Math.random() * 0.01,
        swayPhase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 0.5 + Math.random() * 0.4,
        t: Math.random() * 1000,
      };
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = W * devicePixelRatio;
      canvas!.height = H * devicePixelRatio;
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function drawPetal(p: Petal) {
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.globalAlpha = p.opacity;
      ctx!.fillStyle = p.color;
      ctx!.beginPath();
      ctx!.moveTo(0, -p.size);
      ctx!.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 0.9, p.size * 0.6, 0, p.size);
      ctx!.bezierCurveTo(-p.size * 0.9, p.size * 0.6, -p.size * 0.9, -p.size * 0.6, 0, -p.size);
      ctx!.fill();
      ctx!.restore();
    }

    function tick() {
      ctx!.clearRect(0, 0, W, H);
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.t += 1;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.t * p.swayFreq + p.swayPhase) * (p.swayAmp * 0.02);
        p.rot += p.rotSpeed;
        if (p.y > H + 20 || p.x > W + 20) {
          petals[i] = makePetal(false);
          continue;
        }
        drawPetal(p);
      }
      raf = requestAnimationFrame(tick);
    }

    resize();
    const count = Math.min(60, Math.round((W * H) / 16000));
    petals = Array.from({ length: count }, () => makePetal(true));
    raf = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas id="petal-canvas" ref={canvasRef} />;
}
