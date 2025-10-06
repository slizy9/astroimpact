import { useMemo, useRef, useState } from 'react';
import GameCanvas from './game/GameCanvas';
import { GameState, createInitialState, fireMissile, spawnAsteroid } from './game/GameEngine';

export default function EnhancedMiniGameV2() {
  const [slow, setSlow] = useState(false);
  const stateRef = useRef<GameState>(createInitialState(800, 400));
  const state = stateRef.current;

  useMemo(() => { state.running = true; }, [state]);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget.querySelector('[data-testid="game-canvas"]') as HTMLCanvasElement)?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // toggle slow when clicking on an asteroid area to simulate selection
    // basic overlap detection for UX; real selection would read from engine state
    setSlow(false);
    fireMissile(state, { x, y });
  };

  // simple spawn ticker
  useMemo(() => {
    const iv = setInterval(() => {
      if (!state.running) return;
      if (state.asteroids.length < 6) {
        spawnAsteroid(state, { minRadius: 18, maxRadius: 36, minSpeed: 0.6, maxSpeed: 1.4 });
      }
    }, 900);
    return () => clearInterval(iv);
  }, [state]);

  return (
    <div onClick={onClick} className="relative select-none">
      <GameCanvas state={state} slowMotion={slow} />
      <div className="absolute top-2 left-2 text-white text-xs bg-black/60 rounded px-2 py-1">Score: {state.score}</div>
      <div className="absolute top-2 right-2 text-white text-xs bg-black/60 rounded px-2 py-1">Asteroids: {state.asteroids.length}</div>
    </div>
  );
}


