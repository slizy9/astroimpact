import { useEffect, useRef } from 'react';
import { M } from './motion';

type Orbit3DCanvasProps = {
  className?: string;
  height?: number;
};

export function Orbit3DCanvas({ className, height = 400 }: Orbit3DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(height * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    let raf = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Subtle vignette
      const rad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2);
      rad.addColorStop(0, 'rgba(255,255,255,0.02)');
      rad.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);

      // Scene parameters
      const cx = w / 2;
      const cy = h / 2;
      const tilt = 0.45; // orbital plane tilt

      // Draw elliptical orbit with perspective
      const rx = Math.min(w, h) * 0.35;
      const ry = rx * (1 - 0.4 * Math.sin(tilt));

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.15);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.02) {
        const x = rx * Math.cos(a);
        const y = ry * Math.sin(a);
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Earth (slight glow)
      const earthR = Math.max(10 * dpr, rx * 0.09);
      const glow = ctx.createRadialGradient(0, 0, earthR * 0.6, 0, 0, earthR * 2);
      glow.addColorStop(0, 'rgba(0,191,255,0.8)');
      glow.addColorStop(1, 'rgba(0,191,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, earthR * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00BFFF';
      ctx.beginPath();
      ctx.arc(0, 0, earthR, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting meteor with simple lighting and trailing
      const speed = 0.9; // radians per second
      t += 0.016;
      const a = t * speed;
      const mx = rx * Math.cos(a);
      const my = ry * Math.sin(a);

      // depth cue: scale and brightness by y
      const depth = (my + ry) / (2 * ry); // 0..1
      const mSize = (3 + 3 * (1 - depth)) * dpr;

      // trail
      ctx.strokeStyle = 'rgba(255,68,68,0.35)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const aa = a - i * 0.06;
        const tx = rx * Math.cos(aa);
        const ty = ry * Math.sin(aa);
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // meteor
      const light = Math.round(180 + 60 * (1 - depth));
      ctx.fillStyle = `rgb(${light},70,70)`;
      ctx.beginPath();
      ctx.arc(mx, my, mSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [height]);

  return (
    <div className={className} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <M.div
        className="absolute inset-x-0 bottom-2 text-center text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ fontSize: '12px' }}
      >
        Real-time trajectories (3D)
      </M.div>
    </div>
  );
}

export default Orbit3DCanvas;


