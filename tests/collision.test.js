import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createPlayer } from '../src/systems/physics.js';
import { moveAndCollide, isSolid } from '../src/systems/collision.js';
import testRoom from '../src/data/levels/testRoom.js';

// A small room: solid floor along the bottom, walls on the sides.
const room = {
  tiles: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1]
  ]
};
const T = CONFIG.TILE;

describe('collision', () => {
  it('lands you on top of the floor instead of through it', () => {
    const p = { ...createPlayer(T, 0), vy: 2000 };
    const out = moveAndCollide(p, room, 0.1);
    expect(out.onGround).toBe(true);
    expect(out.vy).toBe(0);
    expect(out.y + out.h).toBeCloseTo(2 * T, 5);
  });

  it('stops you at a wall', () => {
    const p = { ...createPlayer(T, T), vx: -2000 };
    const out = moveAndCollide(p, room, 0.1);
    expect(out.x).toBeCloseTo(T, 5);
    expect(out.vx).toBe(0);
  });

  it('bonks your head on a ceiling', () => {
    const ceiling = { tiles: [[1, 1, 1], [0, 0, 0], [1, 1, 1]] };
    const p = { ...createPlayer(T, T + 8), vy: -2000 };
    const out = moveAndCollide(p, ceiling, 0.1);
    expect(out.vy).toBe(0);
    expect(out.y).toBeCloseTo(T, 5);
  });

  it('lets you fall through empty air', () => {
    const out = moveAndCollide({ ...createPlayer(T, 0), vy: 100 }, room, 0.01);
    expect(out.onGround).toBe(false);
  });

  it('treats outside the level as not solid', () => {
    expect(isSolid(room, -1, 0)).toBe(false);
    expect(isSolid(room, 0, 99)).toBe(false);
  });
});

describe('test room', () => {
  it('is a rectangle with a solid floor and no ragged rows', () => {
    const width = testRoom.tiles[0].length;
    expect(testRoom.tiles.every((r) => r.length === width)).toBe(true);
    expect(testRoom.tiles.at(-1).every((t) => t === 1)).toBe(true);
  });

  it('spawns the player inside the room, not in a wall', () => {
    const col = Math.floor(testRoom.spawn.x / T);
    const row = Math.floor(testRoom.spawn.y / T);
    expect(isSolid(testRoom, col, row)).toBe(false);
  });
});
