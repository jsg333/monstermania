import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import { parseLevel } from '../src/data/levels/format.js';
import playground from '../src/data/levels/playground.js';

const T = CONFIG.TILE;

describe('level format', () => {
  const level = parseLevel('t', `
1111
1P^S
1111
`);

  it('reads solid blocks and empty air', () => {
    expect(level.tiles[0]).toEqual([1, 1, 1, 1]);
    expect(level.tiles[1]).toEqual([1, 0, 0, 0]);
  });

  it('finds the start point', () => {
    expect(level.spawn).toEqual({ x: T + 4, y: T });
  });

  it('finds Grumps and Snoozers at the right tiles', () => {
    expect(level.grumps).toEqual([{ x: 2 * T, y: T }]);
    expect(level.snoozers).toEqual([{ x: 3 * T, y: T, awake: false }]);
  });

  it('pads short rows so the grid is never ragged', () => {
    const ragged = parseLevel('r', '1111\n1P\n1111');
    expect(ragged.tiles.every((r) => r.length === 4)).toBe(true);
  });

  it('refuses a level with no start point', () => {
    expect(() => parseLevel('bad', '1111\n1..1')).toThrow(/no P/);
  });
});

describe('the playground level', () => {
  it('has a start, Grumps and Snoozers', () => {
    expect(playground.spawn).toBeTruthy();
    expect(playground.grumps.length).toBeGreaterThan(0);
    expect(playground.snoozers.length).toBeGreaterThan(0);
  });

  it('does not start you inside a wall or on top of a Grump', () => {
    const col = Math.floor(playground.spawn.x / T);
    const row = Math.floor(playground.spawn.y / T);
    expect(playground.tiles[row][col]).toBe(0);
    expect(playground.grumps.some((g) => g.x === col * T && g.y === row * T)).toBe(false);
  });

  it('is wider than a screen, so the camera has something to do', () => {
    expect(playground.widthPx).toBeGreaterThan(1200);
  });
});

describe('the playground teaches the monsters', () => {
  it('has a Fungy and a Gogio in it', async () => {
    const { default: pg } = await import('../src/data/levels/playground.js');
    expect(pg.fungies.length).toBeGreaterThan(0);
    expect(pg.gogios.length).toBeGreaterThan(0);
  });

  it('has a pit too wide to jump, so Fungy is the only way across', async () => {
    const { default: pg } = await import('../src/data/levels/playground.js');
    const floor = pg.tiles[19];
    let widest = 0, run = 0;
    for (const t of floor) { run = t === 0 ? run + 1 : 0; widest = Math.max(widest, run); }
    const jumpableBlocks = (CONFIG.RUN_SPEED * (2 * CONFIG.JUMP_SPEED / CONFIG.GRAVITY)) / T;
    expect(widest).toBeGreaterThan(jumpableBlocks);
  });

  it('has a shelf too high to jump, so Gogio is the only way up', async () => {
    const { default: pg } = await import('../src/data/levels/playground.js');
    const jumpBlocks = ((CONFIG.JUMP_SPEED ** 2) / (2 * CONFIG.GRAVITY)) / T;
    const shelfRow = 6;
    expect(19 - shelfRow).toBeGreaterThan(jumpBlocks);
    expect(pg.tiles[shelfRow].some((t) => t === 1)).toBe(true);
  });
});

describe('every playthrough starts fresh', () => {
  it('does not carry woken Snoozers or a tired Gogio into the next game', async () => {
    const { createState } = await import('../src/state.js');
    const a = createState();
    a.level.snoozers[0].awake = true;
    a.level.gogios[0].bounces = 3;

    const b = createState();
    expect(b.level.snoozers[0].awake).toBe(false);
    expect(b.level.gogios[0].bounces).toBe(0);
  });
});
