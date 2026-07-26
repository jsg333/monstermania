import { describe, it, expect, beforeAll } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createState } from '../src/state.js';
import * as play from '../src/scenes/play.js';

// Run the real game loop for a while and see where the player ends up.
// This is the closest thing to actually playing it without a browser.
function simulate(state, { right = false, left = false, frames = 200, startNow = 1000 }) {
  let now = startNow;
  const input = { left, right, jump: false, jumpPressedAt: -Infinity, jumpConsumed: true };
  const track = [];
  for (let i = 0; i < frames; i++) {
    now += 16.7;
    play.update(state, input, 0.0167, now);
    track.push({ x: state.player.x, y: state.player.y, dead: !!state.deadUntil });
  }
  return track;
}

beforeAll(() => { globalThis.window = { devicePixelRatio: 1 }; });

const T = CONFIG.TILE;

describe('Fungy gets you across the pit you cannot jump', () => {
  it('throws you forward and up when you fall onto him', () => {
    const state = createState();
    const f = state.level.fungies[0];

    // Drop the player straight onto Fungy, running right.
    state.player = { ...state.player, x: f.x, y: f.y - 60, vx: 200, vy: 300, facing: 1, onGround: false };
    const before = { ...state.player };
    simulate(state, { right: true, frames: 6 });

    expect(state.player.vy).toBeLessThan(0);              // thrown upward
    expect(state.player.vx).toBeGreaterThan(before.vx);   // and forward
  });

  it('actually carries you to the far side of the pit', () => {
    const state = createState();
    const f = state.level.fungies[0];
    const pitEndsAt = 31 * T;                              // floor starts again here

    state.player = { ...state.player, x: f.x - 40, y: f.y - 120, vx: CONFIG.RUN_SPEED, vy: 200, facing: 1, onGround: false };
    const track = simulate(state, { right: true, frames: 160 });

    // Furthest point reached — he keeps running afterwards and eventually
    // meets a Grump, which is fine and not what this test is about.
    const furthest = Math.max(...track.filter((t) => !t.dead).map((t) => t.x));
    expect(furthest).toBeGreaterThan(pitEndsAt);
  });
});

describe('Gogio gets you to the shelf you cannot reach', () => {
  const shelfRow = 6;

  it('launches you far higher than your own jump can', () => {
    const state = createState();
    const g = state.level.gogios[0];
    const myJumpHeight = (CONFIG.JUMP_SPEED ** 2) / (2 * CONFIG.GRAVITY);

    state.player = { ...state.player, x: g.x, y: g.y - 50, vx: 0, vy: 300, facing: 1, onGround: false };
    const track = simulate(state, { frames: 140 });

    const highest = Math.min(...track.map((t) => t.y));
    const launchedFrom = g.y;
    expect(launchedFrom - highest).toBeGreaterThan(myJumpHeight * 1.5);
  });

  it('gets you above the high shelf', () => {
    const state = createState();
    const g = state.level.gogios[0];
    state.player = { ...state.player, x: g.x, y: g.y - 50, vx: 0, vy: 300, facing: 1, onGround: false };
    const track = simulate(state, { frames: 140 });

    const highest = Math.min(...track.map((t) => t.y));
    expect(highest).toBeLessThan(shelfRow * T);
  });

  it('bounces you less on the second landing in a row', () => {
    const state = createState();
    const g = state.level.gogios[0];
    const drop = () => {
      state.player = { ...state.player, x: g.x, y: g.y - 50, vx: 0, vy: 300, facing: 1, onGround: false };
      const track = simulate(state, { frames: 120 });
      return Math.min(...track.map((t) => t.y));
    };
    const first = drop();
    const second = drop();
    expect(second).toBeGreaterThan(first); // higher y = didn't go as high
  });
});

describe('the playground is survivable', () => {
  it('does not kill you the instant you spawn', () => {
    const state = createState();
    const track = simulate(state, { frames: 30 });
    expect(track.some((t) => t.dead)).toBe(false);
  });

  it('lets you stand still forever without falling through the floor', () => {
    const state = createState();
    simulate(state, { frames: 600 });
    expect(state.player.y).toBeLessThan(state.level.heightPx);
    expect(state.deaths).toBe(0);
  });
});
