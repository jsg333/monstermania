import { describe, it, expect, beforeAll } from 'vitest';
import { createState } from '../src/state.js';
import * as play from '../src/scenes/play.js';

// A pretend canvas. Every 2D call is recorded and does nothing.
function mockCtx(w = 1280, h = 720) {
  const noop = () => {};
  return new Proxy({
    canvas: { width: w, height: h },
    fillStyle: '', strokeStyle: '', font: '', globalAlpha: 1
  }, {
    get: (t, k) => (k in t ? t[k] : noop),
    set: (t, k, v) => ((t[k] = v), true)
  });
}

const noInput = { left: false, right: false, jump: false, jumpPressedAt: -Infinity, jumpConsumed: true };

beforeAll(() => {
  globalThis.window = { devicePixelRatio: 1 };
});

// This is the test that would have caught the crash: the real scene, running
// real frames, not just the pure helpers underneath it.
describe('the game actually runs', () => {
  it('survives 600 frames of standing still', () => {
    const state = createState();
    const ctx = mockCtx();
    let now = 0;
    expect(() => {
      for (let i = 0; i < 600; i++) {
        now += 16.7;
        play.update(state, noInput, 0.0167, now);
        play.draw(ctx, state, 60);
      }
    }).not.toThrow();
  });

  it('survives 900 frames of running right and mashing jump', () => {
    const state = createState();
    const ctx = mockCtx();
    let now = 0;
    expect(() => {
      for (let i = 0; i < 900; i++) {
        now += 16.7;
        const input = {
          left: false, right: true,
          jump: i % 20 < 8,
          jumpPressedAt: i % 20 === 0 ? now : now - 500,
          jumpConsumed: i % 20 !== 0
        };
        play.update(state, input, 0.0167, now);
        play.draw(ctx, state, 60);
      }
    }).not.toThrow();
  });

  it('keeps the player somewhere sane after all that', () => {
    const state = createState();
    let now = 0;
    for (let i = 0; i < 900; i++) {
      now += 16.7;
      play.update(state, { ...noInput, right: true }, 0.0167, now);
    }
    expect(Number.isFinite(state.player.x)).toBe(true);
    expect(Number.isFinite(state.player.y)).toBe(true);
  });
});
