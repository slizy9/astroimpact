import { useEffect, useRef } from 'react';
import { Asteroid, GameState, step } from './GameEngine';

export interface GameCanvasProps {
  state: GameState;
  slowMotion: boolean;
}

export default function GameCanvas({ state, slowMotion }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = state.width * dpr;
    canvas.height = state.height * dpr;
    canvas.style.width = state.width + 'px';
    canvas.style.height = state.height + 'px';
    ctx.scale(dpr, dpr);

    const render = () => {
      const now = performance.now();
      const last = lastRef.current || now;
      const dt = now - last;
      lastRef.current = now;

      step(state, dt, slowMotion ? 0.25 : 1);

      // draw
      ctx.fillStyle = 'rgba(0, 4, 40, 1)';
      ctx.fillRect(0, 0, state.width, state.height);

      // timer
      ctx.fillStyle = state.timeRemaining > 30 ? '#10B981' : state.timeRemaining > 10 ? '#F59E0B' : '#EF4444';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱️ ${Math.floor(state.timeRemaining / 60)}:${Math.floor(state.timeRemaining % 60).toString().padStart(2, '0')}`,
        state.width / 2, 24);

      // earth
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.arc(state.earth.pos.x, state.earth.pos.y, state.earth.radius, 0, Math.PI * 2);
      ctx.fill();

      // asteroids
      for (const a of state.asteroids as Asteroid[]) {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(a.pos.x, a.pos.y, a.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // missiles
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (const m of state.missiles) {
        ctx.beginPath();
        ctx.moveTo(m.pos.x, m.pos.y);
        ctx.lineTo(m.pos.x - m.vel.x * 30, m.pos.y - m.vel.y * 30);
        ctx.stroke();
      }

      if (state.running) requestAnimationFrame(render);
    };

    lastRef.current = 0;
    requestAnimationFrame(render);
    return () => { lastRef.current = 0; };
  }, [state, slowMotion]);

  return (
    <canvas data-testid="game-canvas" ref={canvasRef} />
  );
}


