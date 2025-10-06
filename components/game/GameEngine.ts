export type Vector = { x: number; y: number };

export interface Asteroid {
  id: number;
  pos: Vector;
  vel: Vector;
  radius: number;
  destroyed: boolean;
  name?: string;
}

export interface Missile {
  id: number;
  pos: Vector;
  vel: Vector;
  radius: number;
  active: boolean;
}

export interface GameState {
  width: number;
  height: number;
  earth: { pos: Vector; radius: number };
  asteroids: Asteroid[];
  missiles: Missile[];
  score: number;
  timeRemaining: number; // seconds
  running: boolean;
  paused: boolean;
}

export interface SpawnConfig {
  minRadius: number;
  maxRadius: number;
  minSpeed: number;
  maxSpeed: number;
}

let nextAsteroidId = 1;
let nextMissileId = 1;

export function createInitialState(width: number, height: number): GameState {
  return {
    width,
    height,
    earth: { pos: { x: width / 2, y: height - 30 }, radius: 25 },
    asteroids: [],
    missiles: [],
    score: 0,
    timeRemaining: 90,
    running: false,
    paused: false,
  };
}

export function spawnAsteroid(state: GameState, cfg: SpawnConfig, rng = Math.random): Asteroid {
  const side = Math.floor(rng() * 3); // top/right/left only
  const radius = cfg.minRadius + rng() * (cfg.maxRadius - cfg.minRadius);
  const speed = cfg.minSpeed + rng() * (cfg.maxSpeed - cfg.minSpeed);
  let pos: Vector; let vel: Vector;
  switch (side) {
    case 0: // top
      pos = { x: rng() * state.width, y: -20 };
      vel = { x: (rng() - 0.5) * 1.2, y: speed };
      break;
    case 1: // right
      pos = { x: state.width + 20, y: rng() * state.height };
      vel = { x: -speed, y: (rng() - 0.5) * 1.2 };
      break;
    default: // left
      pos = { x: -20, y: rng() * state.height };
      vel = { x: speed, y: (rng() - 0.5) * 1.2 };
  }
  const a: Asteroid = { id: nextAsteroidId++, pos, vel, radius, destroyed: false };
  state.asteroids.push(a);
  return a;
}

export function fireMissile(state: GameState, target: Vector, speed = 8): Missile {
  const dx = target.x - state.earth.pos.x;
  const dy = target.y - state.earth.pos.y;
  const dist = Math.hypot(dx, dy) || 1;
  const missile: Missile = {
    id: nextMissileId++,
    pos: { x: state.earth.pos.x, y: state.earth.pos.y },
    vel: { x: (dx / dist) * speed, y: (dy / dist) * speed },
    radius: 3,
    active: true,
  };
  state.missiles.push(missile);
  return missile;
}

export function step(state: GameState, dtMs: number, speedFactor = 1): void {
  if (!state.running) return;
  const dt = (dtMs / 16.6667) * speedFactor; // normalize to ~60fps steps

  // timer (real time, independent of speedFactor)
  state.timeRemaining = Math.max(0, state.timeRemaining - dtMs / 1000);

  // move asteroids
  for (const a of state.asteroids) {
    if (a.destroyed) continue;
    a.pos.x += a.vel.x * dt;
    a.pos.y += a.vel.y * dt;
  }

  // move missiles
  for (const m of state.missiles) {
    if (!m.active) continue;
    m.pos.x += m.vel.x * dt;
    m.pos.y += m.vel.y * dt;
    if (m.pos.x < 0 || m.pos.x > state.width || m.pos.y < 0 || m.pos.y > state.height) m.active = false;
  }

  // collisions (missile vs asteroid)
  for (const m of state.missiles) {
    if (!m.active) continue;
    for (const a of state.asteroids) {
      if (a.destroyed) continue;
      const d = Math.hypot(m.pos.x - a.pos.x, m.pos.y - a.pos.y);
      if (d < a.radius + m.radius) {
        a.destroyed = true;
        m.active = false;
        state.score += 10;
      }
    }
  }

  // collisions (asteroid vs earth)
  for (const a of state.asteroids) {
    if (a.destroyed) continue;
    const d = Math.hypot(a.pos.x - state.earth.pos.x, a.pos.y - state.earth.pos.y);
    if (d < a.radius + state.earth.radius) {
      state.running = false;
      state.timeRemaining = 0;
    }
  }

  // cleanup
  state.asteroids = state.asteroids.filter(a => !a.destroyed);
  state.missiles = state.missiles.filter(m => m.active);
}

