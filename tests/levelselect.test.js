import { describe, it, expect, beforeEach } from 'vitest';
import { update, cardRects, hitCard } from '../src/scenes/levelSelect.js';
import { blankSave, recordClear } from '../src/systems/save.js';
import world1 from '../src/data/levels/world1.js';

const store = new Map();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k)
  };
});

const view = { w: 1280, h: 720 };
const NOW = 10_000;
const makeSel = (save = blankSave()) => ({
  levels: world1, index: 0, lastMove: 0, openedAt: 0, save
});
const idle = {
  left: false, right: false, up: false, down: false, jump: false,
  confirm: false, escape: false, pointerClick: false, jumpFromPointer: false,
  pointerX: 0, pointerY: 0
};

// Jeff found this by playing: every card looks like a button, but clicking one
// launched whatever the KEYBOARD had highlighted — always 1-1. So clicking
// through the levels silently replayed level one, which is why the levels
// "all looked the same".
describe('clicking a level card plays THAT level', () => {
  const allOpen = () => {
    let s = blankSave();
    for (const l of world1) s = recordClear(s, l.id, 0);
    return s;
  };

  it('launches the card you clicked, not the highlighted one', () => {
    const sel = makeSel(allOpen());
    const card = cardRects(sel, view)[3];
    const chosen = update(sel, {
      ...idle, pointerClick: true,
      pointerX: card.x + card.w / 2, pointerY: card.y + card.h / 2
    }, NOW, view);
    expect(chosen).toBe(world1[3]);
    expect(sel.index).toBe(3);
  });

  it('works for every card on the row', () => {
    for (let i = 0; i < world1.length; i++) {
      const sel = makeSel(allOpen());
      const card = cardRects(sel, view)[i];
      const chosen = update(sel, {
        ...idle, pointerClick: true,
        pointerX: card.x + 4, pointerY: card.y + 4
      }, NOW, view);
      expect(chosen, `card ${i}`).toBe(world1[i]);
    }
  });

  it('does nothing when you click empty space', () => {
    const sel = makeSel(allOpen());
    const chosen = update(sel, { ...idle, pointerClick: true, pointerX: 5, pointerY: 5 }, NOW, view);
    expect(chosen).toBe(null);
    expect(sel.index).toBe(0);
  });

  it('highlights but does not launch a locked card', () => {
    const sel = makeSel();                       // only 1-1 unlocked
    const card = cardRects(sel, view)[4];
    const chosen = update(sel, {
      ...idle, pointerClick: true,
      pointerX: card.x + 10, pointerY: card.y + 10
    }, NOW, view);
    expect(chosen).toBe(null);
    expect(sel.index).toBe(4);                   // you can still look at it
  });

  it('consumes the click so it cannot fire twice', () => {
    const sel = makeSel(allOpen());
    const card = cardRects(sel, view)[2];
    const input = { ...idle, pointerClick: true, pointerX: card.x + 5, pointerY: card.y + 5 };
    update(sel, input, NOW, view);
    expect(input.pointerClick).toBe(false);
  });
});

describe('the keyboard still works', () => {
  it('plays the highlighted level on a key press', () => {
    const sel = makeSel();
    const chosen = update(sel, { ...idle, jump: true }, NOW, view);
    expect(chosen).toBe(world1[0]);
  });

  it('moves the highlight with the arrows', () => {
    let s = recordClear(blankSave(), '1-1', 0);
    const sel = makeSel(s);
    update(sel, { ...idle, right: true }, NOW, view);
    expect(sel.index).toBe(1);
  });

  // A mouse press sets the jump flag too. Without this, clicking empty space
  // would still launch the highlighted card — the original bug wearing a hat.
  it('does not launch the highlighted card from a stray mouse press', () => {
    const sel = makeSel();
    const chosen = update(sel, { ...idle, jump: true, jumpFromPointer: true }, NOW, view);
    expect(chosen).toBe(null);
  });
});

describe('what you see is what you can click', () => {
  it('lays every card out on screen', () => {
    const sel = makeSel();
    for (const r of cardRects(sel, view)) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(view.w);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.y + r.h).toBeLessThanOrEqual(view.h);
    }
  });

  it('never overlaps two cards', () => {
    const sel = makeSel();
    const rects = cardRects(sel, view);
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i].x).toBeGreaterThan(rects[i - 1].x + rects[i - 1].w);
    }
  });

  it('hit-tests the same boxes it draws', () => {
    const sel = makeSel();
    const rects = cardRects(sel, view);
    for (const r of rects) {
      expect(hitCard(sel, view, r.x + r.w / 2, r.y + r.h / 2).i).toBe(r.i);
    }
  });
});
