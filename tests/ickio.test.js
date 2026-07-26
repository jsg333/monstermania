import { describe, it, expect, beforeAll } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createPlayer, speed } from '../src/systems/physics.js';
import { createState } from '../src/state.js';
import * as play from '../src/scenes/play.js';
import { parseLevel } from '../src/data/levels/format.js';
import { holeBox, enteredIckio, applyIckio, reachedExit } from '../src/systems/ickio.js';

const T = CONFIG.TILE;
beforeAll(() => { globalThis.window = { devicePixelRatio: 1 }; });

const level = () => parseLevel('t', `
11111111
1P.i..i1
1.....E1
11111111
`);

const at = (ick, over = {}) => ({
  ...createPlayer(ick.x + (T - 24) / 2, ick.y), ickioIgnore: null, ...over
});

describe('Ickios pair up', () => {
  it('links them two at a time in reading order', () => {
    const l = parseLevel('t', '1111111111\n1Pi.i.i.i1\n1111111111');
    expect(l.ickios).toHaveLength(4);
    expect(l.ickios[0].link).toBe(l.ickios[1].id);
    expect(l.ickios[1].link).toBe(l.ickios[0].id);
    expect(l.ickios[2].link).toBe(l.ickios[3].id);
  });

  it('refuses a level with an odd number of Ickios', () => {
    expect(() => parseLevel('bad', '11111\n1Pi.1\n11111')).toThrow(/pairs/);
  });

  it('is fine with a level that has none at all', () => {
    expect(parseLevel('t', '1111\n1P.1\n1111').ickios).toEqual([]);
  });
});

describe('diving in', () => {
  it('happens on touch, with no button press', () => {
    const l = level();
    expect(enteredIckio(at(l.ickios[0]), l)).toBeTruthy();
  });

  it('does not trigger from across the room', () => {
    const l = level();
    expect(enteredIckio({ ...createPlayer(0, 0) }, l)).toBe(null);
  });

  it('puts you at the other Ickio of the pair', () => {
    const l = level();
    const out = applyIckio(at(l.ickios[0]), l);
    expect(out.used.to.id).toBe(l.ickios[1].id);
    expect(out.player.x).toBeGreaterThan(l.ickios[1].x - T);
    expect(out.player.x).toBeLessThan(l.ickios[1].x + T);
  });
});

// ⭐ The rule the entire game is built on. If this test ever fails, something
// has "helpfully" normalised the speed and Monstermania has lost its ceiling.
describe('Ickio burps you out just as fast as you went in', () => {
  it('keeps your speed exactly', () => {
    const l = level();
    const fast = at(l.ickios[0], { vx: 237, vy: 941 });
    const out = applyIckio(fast, l);
    expect(out.player.vx).toBe(237);
    expect(out.player.vy).toBe(941);
    expect(speed(out.player)).toBeCloseTo(speed(fast), 10);
  });

  it('sends you out faster when you fall in faster', () => {
    const l = level();
    const slow = applyIckio(at(l.ickios[0], { vx: 60, vy: 60 }), l).player;
    const l2 = level();
    const fast = applyIckio(at(l2.ickios[0], { vx: 60, vy: 1200 }), l2).player;
    expect(speed(fast)).toBeGreaterThan(speed(slow) * 5);
  });

  it('does not quietly cap you at running speed', () => {
    const l = level();
    const out = applyIckio(at(l.ickios[0], { vx: CONFIG.RUN_SPEED * 4, vy: 0 }), l);
    expect(out.player.vx).toBeGreaterThan(CONFIG.RUN_SPEED * 3);
  });
});

describe('no ping-ponging', () => {
  it('ignores the hole you just came out of', () => {
    const l = level();
    const out = applyIckio(at(l.ickios[0], { vy: 100 }), l);
    expect(out.player.ickioIgnore).toBe(l.ickios[1].id);
    const again = applyIckio(out.player, l);
    expect(again.used).toBe(null);
  });

  it('makes it live again once you have moved clear of it', () => {
    const l = level();
    const warped = applyIckio(at(l.ickios[0], { vy: 100 }), l).player;
    const walkedAway = { ...warped, x: warped.x + T * 3 };
    const back = applyIckio(walkedAway, l);
    expect(back.player.ickioIgnore).toBe(null);
  });
});

describe('the Big Ickio finishes the level', () => {
  it('triggers when you touch it', () => {
    const l = level();
    expect(reachedExit({ ...createPlayer(l.exit.x, l.exit.y) }, l)).toBe(true);
  });

  it('does not trigger from far away', () => {
    const l = level();
    expect(reachedExit({ ...createPlayer(0, 0) }, l)).toBe(false);
  });

  it('sets the win state when you reach it while playing', () => {
    const state = createState();
    state.player = { ...state.player, x: state.level.exit.x, y: state.level.exit.y };
    const input = { left: false, right: false, jump: false, jumpPressedAt: -Infinity, jumpConsumed: true };
    play.update(state, input, 0.0167, 5000);
    expect(state.won).toBeTruthy();
  });

  it('freezes the world once you have won', () => {
    const state = createState();
    state.won = 1000;
    const before = { ...state.player };
    const input = { left: false, right: true, jump: false, jumpPressedAt: -Infinity, jumpConsumed: true };
    for (let i = 0; i < 30; i++) play.update(state, input, 0.0167, 1100 + i * 16);
    expect(state.player.x).toBe(before.x);
  });

  // Used to restart the same level. Ethan pointed out that finishing should
  // move you ON, so a press now asks to advance and main.js loads the next one.
  it('moves you onward with any button, after a short pause', () => {
    const state = createState();
    state.won = 1000;
    const pressing = { left: false, right: false, jump: true, jumpPressedAt: 3000, jumpConsumed: false };
    play.update(state, pressing, 0.0167, 3000);
    expect(state.advance).toBe(true);
  });
});

describe('the playground can actually be finished now', () => {
  it('has a Big Ickio exit', () => {
    expect(createState().level.exit).toBeTruthy();
  });

  it('gates the exit behind an unjumpable gap, so Ickio is the only way', () => {
    const l = createState().level;
    const floor = l.tiles[19];
    const exitCol = Math.floor(l.exit.x / T);
    let gap = 0;
    for (let c = exitCol; c >= 0; c--) {
      if (floor[c] === 0) gap++;
      else if (gap > 0) break;
    }
    const jumpable = (CONFIG.RUN_SPEED * (2 * CONFIG.JUMP_SPEED / CONFIG.GRAVITY)) / T;
    expect(gap).toBeGreaterThan(jumpable);
  });
});
