import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import {
  createPlayer, canJump, horizontalStep, verticalStep,
  teleportThroughIckio, speed
} from '../src/systems/physics.js';
import { takeJump } from '../src/systems/input.js';

const NOW = 10_000;
const noInput = { left: false, right: false, jump: false, jumpPressedAt: -Infinity, jumpConsumed: true };
const pressed = () => ({ left: false, right: false, jump: true, jumpPressedAt: NOW, jumpConsumed: false });

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
    const p = verticalStep({ ...createPlayer(), onGround: true }, { jumpNow: true, holding: true }, 0.016);
    expect(p.vy).toBeLessThan(0);
  });

  it('does not launch you in mid-air', () => {
    const p = verticalStep({ ...createPlayer(), onGround: false }, { jumpNow: false, holding: true }, 0.016);
    expect(p.vy).toBeGreaterThan(0); // gravity only
  });

  it('holding the button gets you higher than tapping it', () => {
    const rise = (hold) => {
      let p = { ...createPlayer(), onGround: true };
      let y = 0;
      p = verticalStep(p, { jumpNow: true, holding: true }, 0.016);
      p = { ...p, onGround: false };
      for (let i = 0; i < 40; i++) {
        p = verticalStep(p, { jumpNow: false, holding: hold }, 0.016);
        y += p.vy * 0.016;
      }
      return -y;
    };
    expect(rise(true)).toBeGreaterThan(rise(false));
  });
});

// The bug Ethan caught by feel: "jump doesn't seem very responsive."
// A key press happens between two animation frames, so the frame that reads
// it is always a few milliseconds late. The old check demanded the press and
// the frame share an exact timestamp, so about half of all jumps vanished.
describe('a press made between frames still jumps', () => {
  const grounded = { ...createPlayer(), onGround: true };

  it('works even though the frame is 12ms after the press', () => {
    const input = pressed();
    expect(takeJump(input, canJump(grounded, NOW + 12, CONFIG), NOW + 12, CONFIG)).toBe(true);
  });

  it('works at any realistic frame delay', () => {
    for (const lateBy of [0, 1, 4, 8, 12, 16, 33]) {
      const input = pressed();
      expect(takeJump(input, true, NOW + lateBy, CONFIG)).toBe(true);
    }
  });

  it('gives you exactly one jump per press, not one per frame', () => {
    const input = pressed();
    expect(takeJump(input, true, NOW + 4, CONFIG)).toBe(true);
    expect(takeJump(input, true, NOW + 20, CONFIG)).toBe(false);
    expect(takeJump(input, true, NOW + 36, CONFIG)).toBe(false);
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

  it('has NO jump buffer — a press made in mid-air is thrown away', () => {
    expect(CONFIG.JUMP_BUFFER_MS).toBe(0);
    const input = pressed();
    // Pressed while falling: not allowed, so the press is discarded...
    expect(takeJump(input, false, NOW + 8, CONFIG)).toBe(false);
    // ...and landing a moment later does NOT cash it in.
    expect(takeJump(input, true, NOW + 60, CONFIG)).toBe(false);
  });

  it('would remember the press if the buffer were switched on', () => {
    const input = pressed();
    const withBuffer = { ...CONFIG, JUMP_BUFFER_MS: 120 };
    expect(takeJump(input, false, NOW + 8, withBuffer)).toBe(false);
    expect(takeJump(input, true, NOW + 60, withBuffer)).toBe(true);
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

// Fungy throws you faster than you can run. If running clamped that away, the
// throw would do nothing — and Ickio's momentum, the whole point of the game,
// would break the same way.
describe('a monster can throw you faster than you can run', () => {
  it('does not clamp a boost back down to running speed', () => {
    const fast = { ...createPlayer(), onGround: true, vx: CONFIG.RUN_SPEED * 1.9 };
    const after = horizontalStep(fast, { ...noInput, right: true }, 0.0167);
    expect(after.vx).toBeGreaterThan(CONFIG.RUN_SPEED);
  });

  it('bleeds the boost off gradually instead of instantly', () => {
    let p = { ...createPlayer(), onGround: true, vx: CONFIG.RUN_SPEED * 2 };
    const first = horizontalStep(p, { ...noInput, right: true }, 0.0167).vx;
    expect(first).toBeLessThan(CONFIG.RUN_SPEED * 2);
    expect(first).toBeGreaterThan(CONFIG.RUN_SPEED * 1.9);
  });

  it('settles back to exactly running speed and stays there', () => {
    let p = { ...createPlayer(), onGround: true, vx: CONFIG.RUN_SPEED * 2 };
    for (let i = 0; i < 200; i++) p = horizontalStep(p, { ...noInput, right: true }, 0.0167);
    expect(p.vx).toBeCloseTo(CONFIG.RUN_SPEED, 5);
  });

  it('still lets you turn around while boosted', () => {
    const p = { ...createPlayer(), onGround: true, vx: CONFIG.RUN_SPEED * 2 };
    const after = horizontalStep(p, { ...noInput, left: true }, 0.0167);
    expect(after.vx).toBeLessThan(CONFIG.RUN_SPEED * 2);
  });
});
