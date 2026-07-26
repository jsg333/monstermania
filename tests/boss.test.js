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
  // Jeff found a Gogio sitting directly under the top platform in 1-5: bounce
  // and you smack into its underside, so the platform was unreachable. The old
  // rule only looked 6 tiles up, and that platform was 9 tiles up.
  //
  // Gogio throws you roughly 15 tiles. Anything solid in his column is
  // something you will hit, so the rule is simply: nothing above him. If you
  // want a player to land on a platform, put the Gogio BESIDE it.
  it('has nothing solid anywhere above a Gogio', () => {
    const T = CONFIG.TILE;
    const offenders = [];
    for (const level of world1) {
      for (const g of level.gogios) {
        const col = g.x / T;
        const row = g.y / T;
        for (let r = row - 1; r >= 0; r--) {
          if (level.tiles[r][col] === 1) {
            offenders.push(`${level.id}: Gogio col ${col} is under a platform ${row - r} tiles up`);
            break;
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('launches you higher than anything you are asked to reach', () => {
    const T = CONFIG.TILE;
    const reach = ((CONFIG.GOGIO_BOUNCE_SPEED ** 2) / (2 * CONFIG.GRAVITY)) / T;
    expect(reach).toBeGreaterThan(10);
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
describe('lethal gaps leave room for error', () => {
  const T = CONFIG.TILE;
  const maxJump = (CONFIG.RUN_SPEED * (2 * CONFIG.JUMP_SPEED / CONFIG.GRAVITY)) / T;
  const comfortable = maxJump * 0.7;

  // Only gaps you can DIE in matter. A dip with a floor under it is a feature;
  // a hole straight down to nothing is the thing that needs a fair width.
  // (The first version of this rule measured gaps in "the row with the most
  // floor", which is meaningless once a level has terrain at several heights.)
  function lethalGaps(level) {
    const found = [];
    for (let r = 0; r < level.rows; r++) {
      let run = 0;
      let seenGround = false;      // a gap must have ground on BOTH sides —
                                   // empty space below the world is not a gap
      for (let c = 1; c < level.cols; c++) {
        const solidHere = level.tiles[r][c] === 1;
        let anythingBelow = false;
        for (let rr = r + 1; rr < level.rows; rr++) {
          if (level.tiles[rr][c] === 1) { anythingBelow = true; break; }
        }

        // Space sealed under a platform is unreachable — a player can never
        // stand there, so it is not a gap they can fall into.
        let roofed = false;
        for (let rr = r - 1; rr >= 0; rr--) {
          if (level.tiles[rr][c] === 1) { roofed = true; break; }
        }

        if (solidHere) {
          if (seenGround && run > 0) found.push({ row: r, width: run, endsAt: c });
          seenGround = true;
          run = 0;
        } else if (seenGround) {
          if (anythingBelow || roofed) run = 0;   // floor to land on, or no way in
          else run++;
        }
      }
    }
    return found;
  }

  function helpNear(level, col) {
    const helpers = [...level.fungies, ...level.gogios, ...level.ickios];
    return helpers.some((h) => Math.abs(h.x / T - col) <= 12);  // a Fungy throw reaches ~11
  }

  it('never asks for a near-maximum jump over a deadly hole', () => {
    const offenders = [];
    for (const level of world1.slice(0, 3)) {
      for (const gap of lethalGaps(level)) {
        if (gap.width > comfortable && !helpNear(level, gap.endsAt)) {
          offenders.push(`${level.id}: ${gap.width}-block deadly gap ending col ${gap.endsAt}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('has no deadly holes at all in 1-1', () => {
    expect(lethalGaps(world1[0])).toEqual([]);
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

// The pit in 1-2 was a hole with a ledge floating in it. Step off the ledge
// and you fell into the void UNDER the far platform and died — then respawned
// and ran straight back into it. It's a dip with a real floor now.
describe('1-2 is about the chasm Fungy throws you over', () => {
  const T = CONFIG.TILE;

  // The chasm is the FIRST gap after the near-side floor. Later empty space in
  // that row is just sky beneath the far plateau, which nobody can stand in.
  function chasmWidth(level, row) {
    const cells = level.tiles[row];
    let i = 1;
    while (i < cells.length && cells[i] !== 1) i++;   // find the near floor
    while (i < cells.length && cells[i] === 1) i++;   // walk to its end
    let run = 0;
    while (i < cells.length && cells[i] !== 1) { run++; i++; }
    return run;
  }

  it('splits the canyon with a gap wider than any jump', () => {
    const jumpReach = (CONFIG.RUN_SPEED * (2 * CONFIG.JUMP_SPEED / CONFIG.GRAVITY)) / T;
    expect(chasmWidth(world1[1], 16)).toBeGreaterThan(jumpReach);
  });

  it('keeps the chasm inside what a Fungy throw can cover', () => {
    expect(chasmWidth(world1[1], 16)).toBeLessThan(11);
  });

  it('puts Fungy on the near side, where you need him', () => {
    expect(world1[1].fungies.length).toBeGreaterThan(0);
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

// Every level had a wall on the left and nothing on the right, so running off
// the end dropped you into the void. In 1-1 — the level that is supposed to be
// impossible to fail — that was the only way to die.
describe('levels are closed on both sides', () => {
  it('walls the right edge as well as the left', async () => {
    const { playground } = await import('../src/data/levels/playground.js');
    for (const level of [...world1, playground]) {
      const last = level.cols - 1;
      const openRows = level.tiles.filter((row) => row[last] !== 1).length;
      expect(openRows, `${level.id || 'playground'} right edge`).toBe(0);
      const leftOpen = level.tiles.filter((row) => row[0] !== 1).length;
      expect(leftOpen, `${level.id || 'playground'} left edge`).toBe(0);
    }
  });
});
