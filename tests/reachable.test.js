import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import world1 from '../src/data/levels/world1.js';

// CAN YOU ACTUALLY FINISH THIS LEVEL?
//
// Bots can't answer that — a scripted player can't climb a tower, so "the bot
// didn't win" tells you nothing. And that blind spot is how an unwinnable 1-2
// shipped: every unit test was green while the level was impossible.
//
// So instead of playing, we solve. Treat every tile you could stand on as a
// node, connect them with the moves the player actually has, and check the
// exit is reachable from the start.
//
// The movement model is deliberately CONSERVATIVE — it under-estimates what a
// player can do. A level this says is beatable definitely is; a level it says
// is stuck might still be beatable by a very good player. False alarms are
// cheap, missed unwinnable levels are not.

const T = CONFIG.TILE;
const JUMP_UP = Math.floor((CONFIG.JUMP_SPEED ** 2) / (2 * CONFIG.GRAVITY) / T);          // 4
const JUMP_ACROSS = Math.floor((CONFIG.RUN_SPEED * (2 * CONFIG.JUMP_SPEED / CONFIG.GRAVITY)) / T * 0.8);  // ~5
const GOGIO_UP = Math.floor((CONFIG.GOGIO_BOUNCE_SPEED ** 2) / (2 * CONFIG.GRAVITY) / T);
const FUNGY_ACROSS = 8;

function solve(level) {
  const solid = (c, r) => r >= 0 && r < level.rows && c >= 0 && c < level.cols && level.tiles[r][c] === 1;
  const standable = (c, r) => !solid(c, r) && solid(c, r + 1);

  const key = (c, r) => `${c},${r}`;
  const start = { c: Math.round(level.spawn.x / T), r: Math.round(level.spawn.y / T) };

  // snap the start down to whatever it's resting on
  let sr = start.r;
  while (sr < level.rows - 1 && !solid(start.c, sr + 1)) sr++;

  const monsterAt = (list, c, r) =>
    list.some((m) => Math.round(m.x / T) === c && Math.abs(Math.round(m.y / T) - r) <= 1);

  const seen = new Set([key(start.c, sr)]);
  const queue = [{ c: start.c, r: sr }];

  while (queue.length) {
    const { c, r } = queue.shift();
    const add = (nc, nr) => {
      if (nc < 0 || nc >= level.cols || nr < 0 || nr >= level.rows) return;
      if (solid(nc, nr)) return;
      // let it settle onto the ground below
      let rr = nr;
      while (rr < level.rows - 1 && !solid(nc, rr + 1)) rr++;
      if (!standable(nc, rr)) return;
      const k = key(nc, rr);
      if (!seen.has(k)) { seen.add(k); queue.push({ c: nc, r: rr }); }
    };

    // walk / jump / fall
    for (let dc = -JUMP_ACROSS; dc <= JUMP_ACROSS; dc++) {
      for (let dr = -JUMP_UP; dr <= 6; dr++) {
        if (Math.abs(dc) + Math.max(0, -dr) > JUMP_ACROSS + JUMP_UP) continue;
        add(c + dc, r + dr);
      }
    }

    // A Gogio you can reach launches you a long way up — but only as far as
    // the first thing above his head. Modelling the launch without modelling
    // the ceiling is how a Gogio parked under a platform passed as "fine".
    const nearGogio = level.gogios.find(
      (m) => Math.abs(Math.round(m.x / T) - c) <= 1 && Math.abs(Math.round(m.y / T) - r) <= 1
    );
    if (nearGogio) {
      const gcol = Math.round(nearGogio.x / T);
      let ceiling = 0;
      for (let rr = r - 1; rr >= 0; rr--) if (solid(gcol, rr)) { ceiling = rr + 1; break; }
      const top = Math.max(ceiling, r - GOGIO_UP);
      for (let dc = -8; dc <= 8; dc++) for (let nr = top; nr <= r; nr++) add(c + dc, nr);
    }
    // a Fungy throws you a long way sideways
    if (monsterAt(level.fungies, c, r) || monsterAt(level.fungies, c - 1, r) || monsterAt(level.fungies, c + 1, r)) {
      for (let dc = -FUNGY_ACROSS; dc <= FUNGY_ACROSS; dc++) for (let dr = -3; dr <= 4; dr++) add(c + dc, r + dr);
    }
    // Ickio pairs join two places directly
    for (const ick of level.ickios) {
      if (Math.round(ick.x / T) === c && Math.abs(Math.round(ick.y / T) - r) <= 1) {
        const twin = level.ickios.find((i) => i.id === ick.link);
        if (twin) add(Math.round(twin.x / T), Math.round(twin.y / T));
      }
    }
  }

  return seen;
}

function canReach(level, target) {
  const seen = solve(level);
  const c = Math.round(target.x / T);
  const r = Math.round(target.y / T);
  // the exit and coins float a little, so accept anything adjacent
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -2; dr <= 2; dr++) {
      if (seen.has(`${c + dc},${r + dr}`)) return true;
    }
  }
  return false;
}

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
