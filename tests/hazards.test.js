import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createPlayer } from '../src/systems/physics.js';
import { parseLevel } from '../src/data/levels/format.js';
import {
  overlaps, grumpBox, touchingGrump, fellOutOfWorld, isDeadly,
  updateSnoozers, respawn, makePuff, stepPuff
} from '../src/systems/hazards.js';

const T = CONFIG.TILE;
const level = () => parseLevel('t', `
11111
1P^S1
11111
`);

describe('Grumps', () => {
  it('kills you when you stand in the spikes', () => {
    const l = level();
    const p = { ...createPlayer(2 * T, T + T / 2), w: 24, h: 32 };
    expect(touchingGrump(p, l)).toBe(true);
  });

  it('lets you pass just above the spikes', () => {
    const l = level();
    const p = { ...createPlayer(2 * T, T - 30), w: 24, h: 32 };
    expect(touchingGrump(p, l)).toBe(false);
  });

  it('is forgiving — the hitbox is smaller than the tile it sits in', () => {
    const g = { x: 0, y: 0 };
    const b = grumpBox(g);
    expect(b.w).toBeLessThan(T);
    expect(b.h).toBeLessThan(T);
    expect(b.x).toBeGreaterThan(0);       // shaved on the left
    expect(b.y).toBeGreaterThan(T / 2);   // spikes only fill the bottom half
  });
});

describe('falling out of the world', () => {
  it('kills you well below the level, not the moment you leave the floor', () => {
    const l = level();
    expect(fellOutOfWorld({ ...createPlayer(0, l.heightPx - 1) }, l)).toBe(false);
    expect(fellOutOfWorld({ ...createPlayer(0, l.heightPx + 3 * T) }, l)).toBe(true);
  });

  it('isDeadly covers both spikes and pits', () => {
    const l = level();
    expect(isDeadly({ ...createPlayer(2 * T, T + T / 2), w: 24, h: 32 }, l)).toBe(true);
    expect(isDeadly({ ...createPlayer(0, l.heightPx + 3 * T), w: 24, h: 32 }, l)).toBe(true);
    expect(isDeadly({ ...createPlayer(T, T), w: 24, h: 32 }, l)).toBe(false);
  });
});

describe('Snoozers', () => {
  it('wakes up when you touch him and becomes your checkpoint', () => {
    const l = level();
    const start = { x: 0, y: 0 };
    const p = { ...createPlayer(3 * T, T), w: 24, h: 32 };
    const out = updateSnoozers(p, l, start);
    expect(l.snoozers[0].awake).toBe(true);
    expect(out.justWoke).toBeTruthy();
    expect(out.checkpoint.x).toBeCloseTo(3 * T + 4, 5);
  });

  it('only wakes once — walking back over him changes nothing', () => {
    const l = level();
    const p = { ...createPlayer(3 * T, T), w: 24, h: 32 };
    updateSnoozers(p, l, { x: 0, y: 0 });
    const second = updateSnoozers(p, l, { x: 9, y: 9 });
    expect(second.justWoke).toBe(null);
    expect(second.checkpoint).toEqual({ x: 9, y: 9 });
  });

  it('leaves your checkpoint alone if you never touch one', () => {
    const l = level();
    const far = { ...createPlayer(T, T), w: 24, h: 32 };
    expect(updateSnoozers(far, l, { x: 5, y: 5 }).checkpoint).toEqual({ x: 5, y: 5 });
  });
});

describe('coming back after you die', () => {
  it('puts you at the checkpoint with no leftover speed', () => {
    const p = { ...createPlayer(900, 900), vx: 300, vy: -700, jumping: true };
    const out = respawn(p, { x: 64, y: 128 });
    expect([out.x, out.y]).toEqual([64, 128]);
    expect([out.vx, out.vy]).toEqual([0, 0]);
    expect(out.jumping).toBe(false);
  });

  // Ethan's game has no lives and no game-over screen. Dying has to be quick
  // enough that trying the hard jump a 20th time still feels fun.
  it('gets you playing again in well under a second', () => {
    expect(CONFIG.RESPAWN_DELAY_MS).toBeLessThan(1000);
  });
});

describe('the puff of smoke', () => {
  it('appears and then clears itself up', () => {
    let puff = makePuff(createPlayer(100, 100));
    expect(puff.length).toBeGreaterThan(0);
    for (let i = 0; i < 60; i++) puff = stepPuff(puff, 0.016);
    expect(puff.length).toBe(0);
  });
});

describe('overlaps', () => {
  it('is false for boxes that only touch edges', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
});
