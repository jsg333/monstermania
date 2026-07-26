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
  globalThis.__BUILD__ = 'test';
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

// The browser froze on the level-select screen while every unit test passed.
// These run the menu and every real level through the actual scene code.
describe('the menu and every World 1 level actually run', () => {
  it('draws the level select without throwing', async () => {
    const levelSelect = await import('../src/scenes/levelSelect.js');
    const { blankSave } = await import('../src/systems/save.js');
    const world1 = (await import('../src/data/levels/world1.js')).default;
    const ctx = mockCtx();
    const sel = { levels: world1, index: 0, lastMove: 0, openedAt: 0, save: blankSave() };
    expect(() => levelSelect.draw(ctx, sel, { w: 1280, h: 720 })).not.toThrow();
  });

  it('lets you move the selection and pick a level', async () => {
    const levelSelect = await import('../src/scenes/levelSelect.js');
    const { blankSave } = await import('../src/systems/save.js');
    const world1 = (await import('../src/data/levels/world1.js')).default;
    const sel = { levels: world1, index: 0, lastMove: 0, openedAt: 0, save: blankSave() };
    const pressing = { left: false, right: false, jump: true, jumpPressedAt: 0, jumpConsumed: false };
    expect(levelSelect.update(sel, pressing, 5000)).toBe(world1[0]);
  });

  it('runs 400 frames of every World 1 level, boss included', async () => {
    const world1 = (await import('../src/data/levels/world1.js')).default;
    const ctx = mockCtx();
    for (const level of world1) {
      const state = createState(level);
      let now = 1000;
      expect(() => {
        for (let i = 0; i < 400; i++) {
          now += 16.7;
          play.update(state, { ...noInput, right: i % 3 !== 0 }, 0.0167, now);
          play.draw(ctx, state, 60);
        }
      }, `level ${level.id} crashed`).not.toThrow();
    }
  });
});
