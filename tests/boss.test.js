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
