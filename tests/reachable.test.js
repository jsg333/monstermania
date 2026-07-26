import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import world1 from '../src/data/levels/world1.js';
import { canReach } from '../src/systems/solver.js';

const T = CONFIG.TILE;

describe('every level can actually be finished', () => {
  for (const level of world1.filter((l) => !l.boss)) {
    it(`${level.id} — the exit is reachable from the start`, () => {
      expect(canReach(level, level.exit), `${level.id} "${level.title}" is UNWINNABLE`).toBe(true);
    });
  }
});

describe('every Goo Drop can actually be collected', () => {
  for (const level of world1.filter((l) => l.gooDrops.length)) {
    it(`${level.id} — all ${level.gooDrops.length} coins are reachable`, () => {
      const unreachable = level.gooDrops
        .filter((d) => !canReach(level, d))
        .map((d) => `col ${d.x / T} row ${d.y / T}`);
      expect(unreachable).toEqual([]);
    });
  }
});

describe('every checkpoint can actually be used', () => {
  for (const level of world1.filter((l) => l.snoozers.length)) {
    it(`${level.id} — all checkpoints are reachable`, () => {
      const unreachable = level.snoozers
        .filter((s) => !canReach(level, s))
        .map((s) => `col ${s.x / T} row ${s.y / T}`);
      expect(unreachable).toEqual([]);
    });
  }
});

// Ethan's sharpest note from playtesting: "in 1-2 the Fungy doesn't have any
// purpose." He was right — the level is NAMED after Fungy and you could climb
// out of the canyon with ordinary jumps, so the monster was scenery.
//
// A level that teaches a monster has to make that monster necessary. The test
// for that is blunt: take the monster out, and the level should become
// impossible. If it's still winnable without him, he's decoration.
describe('a level named after a monster actually needs that monster', () => {
  const strip = (level, key) => ({ ...level, [key]: [] });

  it('1-2 Meet Fungy is impossible without Fungy', () => {
    const level = world1.find((l) => l.id === '1-2');
    expect(canReach(level, level.exit), 'should be winnable normally').toBe(true);
    expect(canReach(strip(level, 'fungies'), level.exit), 'Fungy is decoration!').toBe(false);
  });

  it('1-3 Meet Gogio is impossible without Gogio', () => {
    const level = world1.find((l) => l.id === '1-3');
    expect(canReach(level, level.exit)).toBe(true);
    expect(canReach(strip(level, 'gogios'), level.exit), 'Gogio is decoration!').toBe(false);
  });

  it('1-5 Ickio! is impossible without Ickio', () => {
    const level = world1.find((l) => l.id === '1-5');
    expect(canReach(level, level.exit)).toBe(true);
    expect(canReach(strip(level, 'ickios'), level.exit), 'Ickio is decoration!').toBe(false);
  });
});
