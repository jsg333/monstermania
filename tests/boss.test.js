import { describe, it, expect, beforeAll } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createPlayer } from '../src/systems/physics.js';
import { createState } from '../src/state.js';
import * as play from '../src/scenes/play.js';
import world1 from '../src/data/levels/world1.js';
import {
  createBoss, bossBox, bossHeadBox, stepBoss, bossCollision, damageBoss,
  speedFor, isWindingUp
} from '../src/systems/boss.js';

beforeAll(() => { globalThis.window = { devicePixelRatio: 1 }; });
const bossLevel = () => world1.find((l) => l.boss);
const NOW = 10_000;

describe('World 1', () => {
  it('has six levels, the last of which is the boss', () => {
    expect(world1).toHaveLength(6);
    expect(world1[5].boss).toBe(true);
    expect(world1.map((l) => l.id)).toEqual(['1-1', '1-2', '1-3', '1-4', '1-5', '1-6']);
  });

  it('gives every level a start and an exit', () => {
    for (const l of world1) {
      expect(l.spawn).toBeTruthy();
      if (!l.boss) expect(l.exit).toBeTruthy();
    }
  });

  it('never starts you inside a wall', () => {
    for (const l of world1) {
      const col = Math.floor(l.spawn.x / CONFIG.TILE);
      const row = Math.floor(l.spawn.y / CONFIG.TILE);
      expect(l.tiles[row][col]).toBe(0);
    }
  });

  it('introduces the monsters in the order the design doc says', () => {
    const byId = Object.fromEntries(world1.map((l) => [l.id, l]));
    expect(byId['1-1'].fungies).toHaveLength(0);   // teach nothing but jumping
    expect(byId['1-1'].grumps).toHaveLength(0);    // and nothing can hurt you
    expect(byId['1-2'].fungies.length).toBeGreaterThan(0);
    expect(byId['1-3'].gogios.length).toBeGreaterThan(0);
    expect(byId['1-4'].grumps.length).toBeGreaterThan(0);
    expect(byId['1-5'].ickios.length).toBeGreaterThan(0);
  });

  it('keeps Ickios paired in every level', () => {
    for (const l of world1) expect(l.ickios.length % 2).toBe(0);
  });

  it('hides Goo Drops to find in the early levels', () => {
    for (const l of world1.slice(0, 5)) expect(l.gooDrops.length).toBeGreaterThan(0);
  });
});

describe('Big Gogio', () => {
  it('starts with three health, as Ethan specified', () => {
    expect(createBoss(bossLevel()).health).toBe(CONFIG.BOSS_HEALTH);
    expect(CONFIG.BOSS_HEALTH).toBe(3);
  });

  it('loses health when you land on his head', () => {
    const b = createBoss(bossLevel());
    const onHead = { ...createPlayer(b.x + b.w / 2 - 12, b.y - 20), vy: 400 };
    expect(bossCollision(b, onHead, 400, NOW)).toBe('hit');
    expect(damageBoss(b, NOW).health).toBe(2);
  });

  it('hurts YOU if you touch him any other way', () => {
    const b = createBoss(bossLevel());
    const beside = { ...createPlayer(b.x + 4, b.y + b.h - 20), vy: 0 };
    expect(bossCollision(b, beside, 0, NOW)).toBe('hurt');
  });

  it('is defeated after three hits', () => {
    let b = createBoss(bossLevel());
    for (let i = 0; i < 3; i++) b = damageBoss(b, NOW + i * 1000);
    expect(b.defeated).toBe(true);
    expect(b.health).toBe(0);
  });

  it('cannot be hurt again while he is flashing', () => {
    const b = damageBoss(createBoss(bossLevel()), NOW);
    const beside = { ...createPlayer(b.x + 4, b.y + b.h - 20), vy: 0 };
    expect(bossCollision(b, beside, 0, NOW + 100)).toBe(null);
  });

  it('gets angrier and faster with every hit', () => {
    expect(speedFor(3)).toBe(1);
    expect(speedFor(2)).toBeGreaterThan(speedFor(3));
    expect(speedFor(1)).toBeGreaterThan(speedFor(2));
  });

  // The rule that makes a boss fair instead of random.
  it('squishes down as a warning before he leaps', () => {
    let b = createBoss(bossLevel());
    const level = bossLevel();
    const player = createPlayer(100, 100);
    let sawWindup = false;
    let now = NOW;
    for (let i = 0; i < 200; i++) {
      now += 16.7;
      b = stepBoss(b, player, level, 0.0167, now);
      if (isWindingUp(b, now)) sawWindup = true;
    }
    expect(sawWindup).toBe(true);
  });

  it('actually leaps into the air', () => {
    let b = createBoss(bossLevel());
    const level = bossLevel();
    const player = createPlayer(100, 100);
    let highest = b.y;
    let now = NOW;
    for (let i = 0; i < 300; i++) {
      now += 16.7;
      b = stepBoss(b, player, level, 0.0167, now);
      highest = Math.min(highest, b.y);
    }
    expect(highest).toBeLessThan(createBoss(level).y - 40);
  });

  it('stays inside the arena', () => {
    let b = createBoss(bossLevel());
    const level = bossLevel();
    let now = NOW;
    for (let i = 0; i < 600; i++) {
      now += 16.7;
      const chaser = createPlayer(i % 2 ? 0 : level.cols * CONFIG.TILE, 400);
      b = stepBoss(b, chaser, level, 0.0167, now);
      expect(b.x).toBeGreaterThanOrEqual(CONFIG.TILE - 1);
      expect(b.x + b.w).toBeLessThanOrEqual(level.cols * CONFIG.TILE);
    }
  });

  it('ends the level when he is beaten', () => {
    const state = createState(bossLevel());
    state.boss = { ...state.boss, health: 1 };
    state.player = { ...state.player, x: state.boss.x + 20, y: state.boss.y - 20, vy: 500 };
    const input = { left: false, right: false, jump: false, jumpPressedAt: -Infinity, jumpConsumed: true };
    play.update(state, input, 0.0167, NOW);
    expect(state.boss.defeated).toBe(true);
    expect(state.won).toBeTruthy();
  });
});

// The design doc promises World 1 is where "you basically can't fail".
// A browser playtest died 11 times on 1-1, which is the exact opposite.
describe('1-1 is genuinely safe, as the difficulty plan promises', () => {
  it('has nothing in it that can hurt you', () => {
    const l = world1[0];
    expect(l.grumps).toHaveLength(0);
    expect(l.gogios).toHaveLength(0);
    expect(l.fungies).toHaveLength(0);
  });

  it('has a floor underneath every gap, so a missed jump costs a moment not a life', () => {
    const l = world1[0];
    const bottom = l.tiles[l.rows - 2];
    const solid = bottom.filter((t) => t === 1).length;
    expect(solid).toBeGreaterThan(l.cols * 0.9);
  });

  it('gives you a way back up out of each dip', () => {
    const l = world1[0];
    const rampRow = l.tiles[l.rows - 3];
    expect(rampRow.some((t) => t === 1)).toBe(true);
  });
});

// Jeff spotted a coin on a shelf that no jump could reach. The cause: the
// Gogio meant to launch you was directly UNDER that shelf, so bouncing just
// bonked your head on its underside. Two of 1-3's three coins were
// unreachable. This rule stops it happening again.
describe('every Gogio has clear sky above him', () => {
  const CLEARANCE = 6;   // tiles

  it('never puts a ceiling right above a bouncer', () => {
    const T = CONFIG.TILE;
    const offenders = [];
    for (const level of world1) {
      for (const g of level.gogios) {
        const col = g.x / T;
        const row = g.y / T;
        for (let r = row - 1; r >= Math.max(0, row - CLEARANCE); r--) {
          if (level.tiles[r][col] === 1) {
            offenders.push(`${level.id}: Gogio at col ${col} has a ceiling ${row - r} tiles above`);
            break;
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('never sits a Gogio directly beneath the platform he launches you to', () => {
    const T = CONFIG.TILE;
    for (const level of world1) {
      for (const g of level.gogios) {
        const col = g.x / T;
        const row = g.y / T;
        // the nearest platform above must be offset sideways, not overhead
        for (let r = row - 1; r >= Math.max(0, row - CLEARANCE); r--) {
          expect(level.tiles[r][col], `${level.id} Gogio col ${col} blocked at row ${r}`).toBe(0);
        }
      }
    }
  });
});

// A coin you cannot reach is worse than no coin — it reads as a bug to a kid.
describe('Goo Drops sit somewhere a player could actually get to', () => {
  it('never floats a coin more than a jump above the nearest solid ground', () => {
    const T = CONFIG.TILE;
    const jumpTiles = ((CONFIG.JUMP_SPEED ** 2) / (2 * CONFIG.GRAVITY)) / T;
    for (const level of world1) {
      for (const d of level.gooDrops) {
        const col = d.x / T;
        const row = d.y / T;
        let floorBelow = null;
        for (let r = row + 1; r < level.rows; r++) {
          if (level.tiles[r][col] === 1) { floorBelow = r; break; }
        }
        expect(floorBelow, `${level.id} coin at col ${col} has nothing under it`).not.toBe(null);
        expect(floorBelow - row, `${level.id} coin at col ${col} floats too high`)
          .toBeLessThanOrEqual(Math.ceil(jumpTiles) + 1);
      }
    }
  });
});

// 1-2 shipped with a checkpoint floating over a pit. Touch it mid-jump and it
// became your respawn point — so every later death dropped you into the void
// and killed you again, forever. The level was literally unwinnable.
//
// A checkpoint IS a promise that you'll be safe when you come back.
describe('every checkpoint is somewhere safe to reappear', () => {
  it('never floats a Snoozer over a pit', async () => {
    const { playground } = await import('../src/data/levels/playground.js');
    const T = CONFIG.TILE;
    const bad = [];
    for (const level of [...world1, playground]) {
      for (const s of level.snoozers) {
        const col = s.x / T, row = s.y / T;
        let floor = null;
        for (let r = row + 1; r < level.rows; r++) {
          if (level.tiles[r][col] === 1) { floor = r; break; }
        }
        if (floor === null) bad.push(`${level.id || 'playground'}: Snoozer col ${col} has NOTHING below it`);
        else if (floor - row > 1) bad.push(`${level.id || 'playground'}: Snoozer col ${col} floats ${floor - row} tiles up`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('never puts a Snoozer where a Grump can reach you on respawn', () => {
    const T = CONFIG.TILE;
    const bad = [];
    for (const level of world1) {
      for (const s of level.snoozers) {
        for (const g of level.grumps) {
          if (Math.abs(g.x - s.x) < T && Math.abs(g.y - s.y) < T) {
            bad.push(`${level.id}: Snoozer and Grump on top of each other at col ${s.x / T}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

// There was no way out of a level except finishing it. A kid stuck on a hard
// jump — or on an unwinnable one — had to reload the page.
describe('you can always leave a level', () => {
  it('goes back to the menu when you press Escape', async () => {
    const play = await import('../src/scenes/play.js');
    const { createState } = await import('../src/state.js');
    const state = createState(world1[2]);
    const input = { left: false, right: false, jump: false, escape: true, jumpPressedAt: -1e9, jumpConsumed: true };
    play.update(state, input, 0.0167, 1000);
    expect(state.backToSelect).toBe(true);
  });

  it('does not leave when you are just playing', async () => {
    const play = await import('../src/scenes/play.js');
    const { createState } = await import('../src/state.js');
    const state = createState(world1[2]);
    const input = { left: false, right: true, jump: false, escape: false, jumpPressedAt: -1e9, jumpConsumed: true };
    play.update(state, input, 0.0167, 1000);
    expect(state.backToSelect).toBeFalsy();
  });
});

// A gap the same width as your theoretical maximum jump is not a jump, it's a
// coin flip — especially with no coyote time and no jump buffer. 1-2 shipped
// with a 6-block gap against a 6.9-block maximum and a scripted playtest died
// 11 times on it without ever getting past.
describe('gaps leave room for error', () => {
  const T = CONFIG.TILE;
  const maxJump = (CONFIG.RUN_SPEED * (2 * CONFIG.JUMP_SPEED / CONFIG.GRAVITY)) / T;
  const comfortable = maxJump * 0.7;

  function gapsIn(level) {
    // widest run of empty tiles on each row that has some floor
    const out = [];
    level.tiles.forEach((row, r) => {
      if (!row.includes(1)) return;
      let run = 0;
      row.forEach((t, c) => {
        if (t === 0) run++;
        else { if (run > 0) out.push({ row: r, width: run, endsAt: c }); run = 0; }
      });
    });
    return out;
  }

  function helpNear(level, row, col) {
    const helpers = [...level.fungies, ...level.gogios, ...level.ickios];
    if (helpers.some((h) => Math.abs(h.x / T - col) <= 6)) return true;
    // or a ledge below to land on
    for (let r = row + 1; r < level.rows; r++) {
      if (level.tiles[r][Math.max(0, Math.min(level.cols - 1, col - 2))] === 1) return true;
    }
    return false;
  }

  it('never asks for a near-maximum jump in the teaching levels', () => {
    const offenders = [];
    for (const level of world1.slice(0, 3)) {
      const floorRow = level.tiles.reduce((best, row, r) =>
        row.filter((t) => t === 1).length > (level.tiles[best] || []).filter((t) => t === 1).length ? r : best, 0);
      for (const gap of gapsIn(level)) {
        if (gap.row !== floorRow) continue;
        if (gap.width > comfortable && !helpNear(level, gap.row, gap.endsAt)) {
          offenders.push(`${level.id}: ${gap.width}-block gap ending col ${gap.endsAt} (comfortable max ${comfortable.toFixed(1)})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

// The pit in 1-2 was a hole with a ledge floating in it. Step off the ledge
// and you fell into the void UNDER the far platform and died — then respawned
// and ran straight back into it. It's a dip with a real floor now.
describe('1-2 is a canyon you can always climb out of', () => {
  it('has an unbroken floor at the bottom of the canyon', () => {
    const l = world1[1];
    const floor = l.tiles[16];
    for (let c = 17; c <= 38; c++) {
      expect(floor[c], `col ${c} of the canyon floor`).toBe(1);
    }
  });

  it('gives you Fungy down there and stepping stones back up', () => {
    const l = world1[1];
    expect(l.fungies.length).toBeGreaterThan(0);
    // some platform between the canyon floor and the far plateau
    const midLedges = l.tiles.slice(9, 16).some((row) => row.includes(1));
    expect(midLedges).toBe(true);
  });
});

// Every level should have its own shape. 1-1 and 1-2 were two flat corridors
// and a playtester said outright that they looked identical.
describe('levels do not share a silhouette', () => {
  function profile(level) {
    // the height of the highest solid tile in each column — a level's outline
    const out = [];
    for (let c = 1; c < level.cols; c++) {
      let top = level.rows;
      for (let r = 0; r < level.rows; r++) if (level.tiles[r][c] === 1) { top = r; break; }
      out.push(top);
    }
    return out;
  }

  it('gives every level a different outline', () => {
    const shapes = world1.map((l) => profile(l).join(','));
    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it('does not build every level on one flat floor', () => {
    for (const level of world1.slice(0, 5)) {
      const heights = new Set(profile(level).filter((h) => h < level.rows));
      expect(heights.size, `${level.id} has only ${heights.size} distinct ground heights`)
        .toBeGreaterThanOrEqual(3);
    }
  });

  it('varies the size and proportions of the levels', () => {
    const shapes = world1.slice(0, 5).map((l) => `${l.cols}x${l.rows}`);
    expect(new Set(shapes).size).toBeGreaterThanOrEqual(4);
  });
});
