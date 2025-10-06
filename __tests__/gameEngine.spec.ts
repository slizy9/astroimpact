import { createInitialState, fireMissile, spawnAsteroid, step } from '../components/game/GameEngine';

describe('GameEngine', () => {
  test('initial state', () => {
    const s = createInitialState(800, 400);
    expect(s.earth.pos.x).toBe(400);
    expect(s.earth.pos.y).toBe(370);
    expect(s.timeRemaining).toBe(90);
    expect(s.running).toBe(false);
  });

  test('fire missile towards target', () => {
    const s = createInitialState(800, 400);
    s.running = true;
    const m = fireMissile(s, { x: 400, y: 0 });
    expect(m.active).toBe(true);
    expect(s.missiles.length).toBe(1);
  });

  test('spawn asteroid from top/right/left', () => {
    const s = createInitialState(800, 400);
    const a = spawnAsteroid(s, { minRadius: 10, maxRadius: 20, minSpeed: 1, maxSpeed: 2 }, () => 0.1);
    expect(a.radius).toBeGreaterThanOrEqual(10);
    expect(s.asteroids.length).toBe(1);
  });

  test('step moves entities and reduces time', () => {
    const s = createInitialState(800, 400);
    s.running = true;
    spawnAsteroid(s, { minRadius: 10, maxRadius: 20, minSpeed: 1, maxSpeed: 2 });
    const timeBefore = s.timeRemaining;
    step(s, 1000); // 1s
    expect(s.timeRemaining).toBeLessThan(timeBefore);
  });

  test('missile destroys asteroid on collision', () => {
    const s = createInitialState(800, 400);
    s.running = true;
    const a = spawnAsteroid(s, { minRadius: 10, maxRadius: 10, minSpeed: 0, maxSpeed: 0 }, () => 0.0);
    // Place asteroid above earth center
    a.pos = { x: s.earth.pos.x, y: s.earth.pos.y - 50 };
    const m = fireMissile(s, { x: a.pos.x, y: a.pos.y }, 20);
    for (let i = 0; i < 10; i++) step(s, 16);
    expect(a.destroyed || !m.active).toBe(true);
    expect(s.score).toBeGreaterThanOrEqual(10);
  });
});


