import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import {
  createPlayer, canJump, jumpRequested, horizontalStep, verticalStep,
  teleportThroughIckio, speed
} from '../src/systems/physics.js';

const NOW = 10_000;
const noInput = { left: false, right: false, jump: false, jumpPressedAt: -Infinity };
const jumpNow = { ...noInput, jump: true, jumpPressedAt: NOW };

describe('running', () => {
  it('speeds up when you hold a direction', () => {
    const p = horizontalStep({ ...createPlayer(), onGround: true }, { ...noInput, right: true }, 0.1);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.facing).toBe(1);
  });

  it('never goes faster than RUN_SPEED', () => {
    let p = { ...createPlayer(), onGround: true };
    for (let i = 0; i < 200; i++) p = horizontalStep(p, { ...noInput, right: true }, 0.016);
    expect(p.vx).toBeCloseTo(CONFIG.RUN_SPEED, 5);
  });

  it('slides to a full stop, not a crawl', () => {
    let p = { ...createPlayer(), onGround: true, vx: CONFIG.RUN_SPEED };
    for (let i = 0; i < 100; i++) p = horizontalStep(p, noInput, 0.016);
    expect(p.vx).toBe(0);
  });

  it('steers less in the air than on the ground', () => {
    const ground = horizontalStep({ ...createPlayer(), onGround: true }, { ...noInput, right: true }, 0.05);
    const air = horizontalStep({ ...createPlayer(), onGround: false }, { ...noInput, right: true }, 0.05);
    expect(air.vx).toBeLessThan(ground.vx);
  });
});

describe('jumping', () => {
  it('launches you upward off the ground', () => {
    const p = verticalStep({ ...createPlayer(), onGround: true }, jumpNow, 0.016, NOW);
    expect(p.vy).toBeLessThan(0);
  });

  it('does not launch you in mid-air', () => {
    const p = verticalStep({ ...createPlayer(), onGround: false }, jumpNow, 0.016, NOW);
    expect(p.vy).toBeGreaterThan(0); // gravity only
  });

  it('holding the button gets you higher than tapping it', () => {
    const rise = (hold) => {
      let p = { ...createPlayer(), onGround: true };
      let y = 0, t = NOW;
      p = verticalStep(p, jumpNow, 0.016, t);
      p = { ...p, onGround: false };
      for (let i = 0; i < 40; i++) {
        t += 16;
        const input = hold ? { ...jumpNow, jumpPressedAt: NOW } : { ...noInput };
        p = verticalStep(p, input, 0.016, t);
        y += p.vy * 0.016;
      }
      return -y;
    };
    expect(rise(true)).toBeGreaterThan(rise(false));
  });
});

// These two tests exist to protect Ethan's design decisions from a future
// assistant who "helpfully" turns them back on. If you change them, ask Ethan.
describe("Ethan's rulings", () => {
  it('has NO coyote time — if you do not jump in time, you fall', () => {
    expect(CONFIG.COYOTE_TIME_MS).toBe(0);
    const airborne = { ...createPlayer(), onGround: false, leftGroundAt: NOW - 1 };
    expect(canJump(airborne, NOW)).toBe(false);
  });

  it('has NO jump buffer — a press before landing is not remembered', () => {
    expect(CONFIG.JUMP_BUFFER_MS).toBe(0);
    expect(jumpRequested({ ...jumpNow, jumpPressedAt: NOW - 50 }, NOW)).toBe(false);
  });

  it('respawns in well under a second', () => {
    expect(CONFIG.RESPAWN_DELAY_MS).toBeLessThan(1000);
  });
});

// ⭐ The rule the whole game is built on.
describe('Ickio', () => {
  it('burps you out exactly as fast as you went in', () => {
    const p = { ...createPlayer(100, 50), vx: 210, vy: 940 };
    const out = teleportThroughIckio(p, { x: 100, y: 50 }, { x: 800, y: 300 });
    expect(speed(out)).toBeCloseTo(speed(p), 10);
    expect(out.vx).toBe(p.vx);
    expect(out.vy).toBe(p.vy);
  });

  it('sends you further when you fall in faster', () => {
    const slow = teleportThroughIckio({ ...createPlayer(0, 0), vx: 100, vy: 100 }, { x: 0, y: 0 }, { x: 500, y: 0 });
    const fast = teleportThroughIckio({ ...createPlayer(0, 0), vx: 100, vy: 900 }, { x: 0, y: 0 }, { x: 500, y: 0 });
    expect(speed(fast)).toBeGreaterThan(speed(slow));
  });

  it('puts you at the far hole, keeping where you were inside it', () => {
    const out = teleportThroughIckio(createPlayer(110, 60), { x: 100, y: 50 }, { x: 700, y: 200 });
    expect(out.x).toBe(710);
    expect(out.y).toBe(210);
  });
});
