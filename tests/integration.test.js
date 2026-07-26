import { describe, it, expect, beforeAll } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createState } from '../src/state.js';
import * as play from '../src/scenes/play.js';

// Run the real game loop for a while and see where the player ends up.
// This is the closest thing to actually playing it without a browser.
function simulate(state, { right = false, left = false, frames = 200, startNow = 1000, jumpAtFrame = null, holdJumpFor = 30 }) {
  let now = startNow;
  const input = { left, right, jump: false, jumpPressedAt: -Infinity, jumpConsumed: true };
  const track = [];
  for (let i = 0; i < frames; i++) {
    now += 16.7;
    if (jumpAtFrame !== null && i === jumpAtFrame) {
      input.jump = true; input.jumpPressedAt = now; input.jumpConsumed = false;
    }
    if (jumpAtFrame !== null && i === jumpAtFrame + holdJumpFor) input.jump = false;
    play.update(state, input, 0.0167, now);
    track.push({ x: state.player.x, y: state.player.y, dead: !!state.deadUntil, deaths: state.deaths });
  }
  return track;
}

beforeAll(() => { globalThis.window = { devicePixelRatio: 1 }; });

const T = CONFIG.TILE;

// The pit is the playground's one real puzzle, so its rules are worth pinning
// down: strolling off the edge must NOT work, and any jump must.
describe('the pit demands a jump, not a stroll', () => {
  const edgeX = 21 * T - 24;          // standing on the last floor tile

  it('kills you if you just walk off the edge', () => {
    const state = createState();
    state.player = { ...state.player, x: edgeX, y: 18 * T, vx: CONFIG.RUN_SPEED, vy: 0, facing: 1, onGround: true };
    const track = simulate(state, { right: true, frames: 120 });
    expect(track.some((t) => t.dead)).toBe(true);
  });

  it('lets you reach the ledge if you jump off the edge', () => {
    const state = createState();
    state.player = { ...state.player, x: edgeX, y: 18 * T, vx: CONFIG.RUN_SPEED, vy: 0, facing: 1, onGround: true };
    const track = simulate(state, { right: true, frames: 90, jumpAtFrame: 0 });
    const ledgeStartsAt = 26 * T;
    const landedSafely = track.some((t) => !t.dead && t.x > ledgeStartsAt && t.y > 19 * T);
    expect(landedSafely).toBe(true);
  });

  it('cannot be jumped in one go — the gap is wider than any jump', () => {
    const reach = CONFIG.RUN_SPEED * (2 * CONFIG.JUMP_SPEED / CONFIG.GRAVITY);
    const gapWidth = (31 - 22) * T;
    expect(gapWidth).toBeGreaterThan(reach);
  });
});

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

    state.player = { ...state.player, x: f.x, y: f.y - 60, vx: CONFIG.RUN_SPEED, vy: 300, facing: 1, onGround: false };
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
