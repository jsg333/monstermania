import { describe, it, expect, beforeEach } from 'vitest';
import { createInput, touchPads, inRect } from '../src/systems/input.js';
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
  const W = 1024, H = 768;
  beforeEach(() => {
    target = fakeTarget();
    globalThis.window = { innerWidth: W, innerHeight: H };
    globalThis.performance = { now: () => 1000 };
    globalThis.document = { activeElement: null };
    input = createInput(target);
  });

  const pads = () => touchPads(W, H);
  const centre = (r) => [r.x + r.w / 2, r.y + r.h / 2];

  it('records where a finger went down', () => {
    target.fire('touchstart', touch(700, 400));
    expect(input.pointerX).toBe(700);
    expect(input.pointerY).toBe(400);
    expect(input.pointerClick).toBe(true);
  });

  // Without this you cannot drag to draw in the Level Maker.
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

  it('moves you when you press the LEFT pad', () => {
    target.fire('touchstart', touch(...centre(pads().left)));
    expect(input.left).toBe(true);
    expect(input.right).toBe(false);
  });

  it('moves you when you press the RIGHT pad', () => {
    target.fire('touchstart', touch(...centre(pads().right)));
    expect(input.right).toBe(true);
  });

  it('jumps when you press anywhere else', () => {
    target.fire('touchstart', touch(...centre(pads().jump)));
    expect(input.jump).toBe(true);
  });

  it('lets go when you lift your finger', () => {
    const [x, y] = centre(pads().left);
    target.fire('touchstart', touch(x, y));
    target.fire('touchend', touch(x, y));
    expect(input.left).toBe(false);
  });

  // A platformer is unplayable if you can't run and jump at the same time.
  it('lets you hold LEFT and press JUMP together', () => {
    const [lx, ly] = centre(pads().left);
    const [jx, jy] = centre(pads().jump);
    target.fire('touchstart', { changedTouches: [{ clientX: lx, clientY: ly, identifier: 1 }], preventDefault() {}, target: null });
    target.fire('touchstart', { changedTouches: [{ clientX: jx, clientY: jy, identifier: 2 }], preventDefault() {}, target: null });
    expect(input.left).toBe(true);
    expect(input.jump).toBe(true);
  });

  it('keeps running when you lift only the jump finger', () => {
    const [lx, ly] = centre(pads().left);
    const [jx, jy] = centre(pads().jump);
    target.fire('touchstart', { changedTouches: [{ clientX: lx, clientY: ly, identifier: 1 }], preventDefault() {}, target: null });
    target.fire('touchstart', { changedTouches: [{ clientX: jx, clientY: jy, identifier: 2 }], preventDefault() {}, target: null });
    target.fire('touchend', { changedTouches: [{ clientX: jx, clientY: jy, identifier: 2 }], preventDefault() {}, target: null });
    expect(input.left).toBe(true);
    expect(input.jump).toBe(false);
  });

  it('slides from one pad to the other', () => {
    const [lx, ly] = centre(pads().left);
    const [rx, ry] = centre(pads().right);
    target.fire('touchstart', touch(lx, ly));
    expect(input.left).toBe(true);
    target.fire('touchmove', touch(rx, ry));
    expect(input.left).toBe(false);
    expect(input.right).toBe(true);
  });

  it('flags that a finger is being used, so the pads get drawn', () => {
    expect(input.usingTouch).toBe(false);
    target.fire('touchstart', touch(400, 400));
    expect(input.usingTouch).toBe(true);
  });

  it('gives the pads finger-sized targets near the bottom', () => {
    const p = pads();
    for (const r of Object.values(p)) {
      expect(r.h).toBeGreaterThanOrEqual(70);
      expect(r.y + r.h).toBeLessThanOrEqual(H);
    }
    expect(inRect(p.left, ...centre(p.left))).toBe(true);
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
