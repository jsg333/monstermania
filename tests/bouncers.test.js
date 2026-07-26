import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createPlayer } from '../src/systems/physics.js';
import { parseLevel } from '../src/data/levels/format.js';
import {
  isLandingOn, gogioPower, bounceGogio, gogioRested, bounceFungy,
  applyBouncers, squashAmount, tiredAmount
} from '../src/systems/bouncers.js';

const T = CONFIG.TILE;
const NOW = 10_000;
const falling = (x, y) => ({ ...createPlayer(x, y), vy: 300 });
const level = () => parseLevel('t', `
1111111
1P.f.g1
1111111
`);

describe('you only bounce by landing on top', () => {
  const m = { x: 3 * T, y: T };

  it('bounces when you are falling onto him', () => {
    expect(isLandingOn(falling(3 * T, T - 20), m)).toBe(true);
  });

  it('does nothing when you are rising past him', () => {
    expect(isLandingOn({ ...createPlayer(3 * T, T - 20), vy: -400 }, m)).toBe(false);
  });

  it('does nothing when you walk into his side', () => {
    expect(isLandingOn(falling(1 * T, T), m)).toBe(false);
  });
});

describe('Gogio gets tired', () => {
  it('gives a full bounce when he is fresh', () => {
    const g = { x: 0, y: 0 };
    expect(bounceGogio(g, NOW)).toBeCloseTo(CONFIG.GOGIO_BOUNCE_SPEED, 5);
  });

  it('gets weaker on each bounce in a row', () => {
    const g = { x: 0, y: 0 };
    const powers = [0, 1, 2].map((i) => bounceGogio(g, NOW + i * 100));
    expect(powers[1]).toBeLessThan(powers[0]);
    expect(powers[2]).toBeLessThan(powers[1]);
    expect(powers[1]).toBeCloseTo(powers[0] * CONFIG.GOGIO_TIRED_STEP, 5);
  });

  it('never flattens to nothing — he stays useful', () => {
    const g = { x: 0, y: 0 };
    let last = Infinity;
    for (let i = 0; i < 10; i++) last = bounceGogio(g, NOW + i * 100);
    expect(last).toBeGreaterThan(0);
    expect(g.bounces).toBe(CONFIG.GOGIO_MAX_BOUNCES);
  });

  it('puffs back to full power if you leave him alone', () => {
    const g = { x: 0, y: 0 };
    bounceGogio(g, NOW);
    bounceGogio(g, NOW + 100);
    const rested = NOW + 100 + CONFIG.GOGIO_RECOVER_MS + 1;
    expect(gogioRested(g, rested)).toBe(true);
    expect(gogioPower(g, rested)).toBeCloseTo(CONFIG.GOGIO_BOUNCE_SPEED, 5);
  });

  it('is not rested a moment before the breather is over', () => {
    const g = { x: 0, y: 0 };
    bounceGogio(g, NOW);
    expect(gogioRested(g, NOW + CONFIG.GOGIO_RECOVER_MS - 1)).toBe(false);
  });
});

describe('Fungy never gets tired', () => {
  it('gives the same hop on the hundredth bounce as the first', () => {
    const f = { x: 0, y: 0 };
    const p = { ...createPlayer(0, 0), vx: 100, facing: 1 };
    const first = bounceFungy(f, p, NOW).vy;
    let last = first;
    for (let i = 0; i < 100; i++) last = bounceFungy(f, p, NOW + i * 50).vy;
    expect(last).toBe(first);
  });

  it('throws you the way you are already running', () => {
    const f = { x: 0, y: 0 };
    const right = bounceFungy(f, { ...createPlayer(), vx: 200, facing: 1 }, NOW);
    const left = bounceFungy(f, { ...createPlayer(), vx: -200, facing: -1 }, NOW);
    expect(right.vx).toBeGreaterThan(200);
    expect(left.vx).toBeLessThan(-200);
  });

  it('uses the way you are facing when you are standing still', () => {
    const f = { x: 0, y: 0 };
    const out = bounceFungy(f, { ...createPlayer(), vx: 0, facing: -1 }, NOW);
    expect(out.vx).toBeLessThan(0);
  });
});

// The design rule: they must be different TOOLS, not a good one and a bad one.
describe('Fungy and Gogio are different tools', () => {
  const g = 1400; // Ethan's gravity
  const height = (v) => (v * v) / (2 * g);

  it('Gogio launches you far higher than Fungy', () => {
    expect(height(CONFIG.GOGIO_BOUNCE_SPEED)).toBeGreaterThan(height(CONFIG.FUNGY_HOP_SPEED) * 2);
  });

  it('Fungy throws you forward and Gogio does not', () => {
    expect(CONFIG.FUNGY_FORWARD_BOOST).toBeGreaterThan(0);
    const f = { x: 0, y: 0 };
    const p = { ...createPlayer(), vx: 0, facing: 1 };
    expect(bounceFungy(f, p, NOW).vx).toBeGreaterThan(0);
    // Gogio returns only an upward power — nothing sideways.
    expect(typeof bounceGogio({ x: 0, y: 0 }, NOW)).toBe('number');
  });
});

describe('applyBouncers', () => {
  it('bounces you off a Gogio you land on', () => {
    const l = level();
    const p = falling(5 * T, T - 10);
    const out = applyBouncers(p, l, NOW);
    expect(out.bounced).toBe('gogio');
    expect(out.player.vy).toBeLessThan(-CONFIG.FUNGY_HOP_SPEED);
    expect(out.player.onGround).toBe(false);
  });

  it('bounces you off a Fungy you land on', () => {
    const l = level();
    const out = applyBouncers({ ...falling(3 * T, T - 10), vx: 200, facing: 1 }, l, NOW);
    expect(out.bounced).toBe('fungy');
    expect(out.player.vy).toBeCloseTo(-CONFIG.FUNGY_HOP_SPEED, 5);
    expect(out.player.vx).toBeGreaterThan(200);
  });

  it('leaves you alone when you are nowhere near one', () => {
    const l = level();
    const p = falling(T, T);
    expect(applyBouncers(p, l, NOW).bounced).toBe(null);
  });

  it('never lets Fungy fling you faster than the game can handle', () => {
    const l = level();
    const fast = { ...falling(3 * T, T - 10), vx: 5000, facing: 1 };
    expect(applyBouncers(fast, l, NOW).player.vx).toBeLessThanOrEqual(CONFIG.RUN_SPEED * 2);
  });
});

describe('squash and stretch', () => {
  it('squashes right after a bounce and settles back', () => {
    const m = { x: 0, y: 0, lastBounceAt: NOW };
    expect(squashAmount(m, NOW)).toBeCloseTo(1, 2);
    expect(squashAmount(m, NOW + CONFIG.SQUASH_MS + 1)).toBe(0);
  });

  it('draws Gogio flatter the more tired he is', () => {
    const g = { x: 0, y: 0 };
    expect(tiredAmount(g, NOW)).toBe(0);
    bounceGogio(g, NOW);
    bounceGogio(g, NOW + 50);
    expect(tiredAmount(g, NOW + 60)).toBeGreaterThan(0);
  });
});
