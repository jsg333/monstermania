import { describe, it, expect, beforeEach } from 'vitest';
import { createInput } from '../src/systems/input.js';
import { menuButtons } from '../src/scenes/levelSelect.js';
import { makerRects } from '../src/scenes/monsterMaker.js';
import { buttonRects } from '../src/scenes/editor.js';
import { MIN_TAP, hit } from '../src/render/uiButtons.js';

// Ethan plays this on an iPad. An iPad has no ESC key, no arrow keys and no
// Enter — so anything that was keyboard-only was simply unavailable to him,
// and ESC being the only way out of a level meant he could get stuck in one.
function fakeTarget() {
  const handlers = {};
  return {
    addEventListener: (name, fn) => { (handlers[name] ||= []).push(fn); },
    removeEventListener: () => {},
    fire: (name, ev) => (handlers[name] || []).forEach((fn) => fn(ev))
  };
}
const touch = (x, y) => ({
  changedTouches: [{ clientX: x, clientY: y, identifier: 1 }],
  preventDefault() {},
  target: null
});

describe('touch input', () => {
  let target, input;
  beforeEach(() => {
    target = fakeTarget();
    globalThis.window = { innerWidth: 1024, innerHeight: 768 };
    globalThis.performance = { now: () => 1000 };
    input = createInput(target);
  });

  it('records where a finger went down', () => {
    target.fire('touchstart', touch(700, 400));
    expect(input.pointerX).toBe(700);
    expect(input.pointerY).toBe(400);
    expect(input.pointerClick).toBe(true);
  });

  // Without this you cannot drag to draw in the Level Maker — the finger's
  // position never updates after the first touch.
  it('follows a finger as it moves', () => {
    target.fire('touchstart', touch(300, 300));
    target.fire('touchmove', touch(420, 360));
    expect(input.pointerX).toBe(420);
    expect(input.pointerY).toBe(360);
  });

  it('knows the finger is still down, so dragging keeps painting', () => {
    target.fire('touchstart', touch(300, 300));
    expect(input.pointerDown).toBe(true);
    target.fire('touchend', touch(300, 300));
    expect(input.pointerDown).toBe(false);
  });

  it('still drives the player: left side steers, right side jumps', () => {
    target.fire('touchstart', touch(100, 400));       // far left quarter
    expect(input.left).toBe(true);
    target.fire('touchstart', touch(900, 400));       // right half
    expect(input.jump).toBe(true);
  });
});

describe('every screen can be used without a keyboard', () => {
  const view = { w: 1024, h: 768 };

  it('has tappable ways into the Monster Maker and the Level Maker', () => {
    const buttons = menuButtons(view);
    expect(buttons.map((b) => b.id)).toEqual(['maker', 'editor']);
    for (const b of buttons) {
      expect(b.w).toBeGreaterThanOrEqual(MIN_TAP);
      expect(b.h).toBeGreaterThanOrEqual(MIN_TAP);
    }
  });

  it('lets you leave the Level Maker without ESC', () => {
    const ids = buttonRects(view).map((b) => b.id);
    expect(ids).toContain('back');
  });

  it('gives the Level Maker buttons finger-sized targets', () => {
    for (const b of buttonRects(view)) {
      expect(b.h, b.id).toBeGreaterThanOrEqual(26);
      expect(b.w, b.id).toBeGreaterThan(80);
    }
  });

  it('lets you build a monster by tapping, with no arrow keys', () => {
    const r = makerRects(view);
    expect(r.arrows.length).toBeGreaterThan(0);
    expect(r.play.h).toBeGreaterThanOrEqual(MIN_TAP);
    expect(hit(r.play, r.play.x + 5, r.play.y + 5)).toBe(true);
  });

  it('keeps the maker rows and arrows apart from each other', () => {
    const r = makerRects(view);
    for (const a of r.arrows) {
      expect(a.w).toBeGreaterThan(20);
      expect(a.h).toBeGreaterThan(20);
    }
  });
});
