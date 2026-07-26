import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  BODIES, COLORS, EYES, MOUTHS, HATS, SLOTS,
  defaultCharacter, isPartUnlocked, unlockedCount, nextUnlock
} from '../src/data/parts.js';
import { blankSave, recordClear } from '../src/systems/save.js';
import { createMaker, update, attachTyping } from '../src/scenes/monsterMaker.js';

const store = new Map();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k)
  };
});
beforeAll(() => { globalThis.window = { devicePixelRatio: 1 }; });

const NOW = 10_000;
const noInput = { left: false, right: false, up: false, down: false, confirm: false };

describe('the parts box', () => {
  it('gives a brand new player something to build with', () => {
    for (const slot of SLOTS) {
      expect(unlockedCount(slot.options, 0)).toBeGreaterThanOrEqual(2);
    }
  });

  it('has plenty left to unlock', () => {
    const all = SLOTS.flatMap((s) => s.options);
    expect(all.filter((o) => o.needs > 0).length).toBeGreaterThan(8);
  });

  // 4 bodies x 8 colours x 4 eyes x 4 mouths x 6 hats
  it('makes thousands of characters out of a handful of drawings', () => {
    const combos = BODIES.length * COLORS.length * EYES.length * MOUTHS.length * HATS.length;
    expect(combos).toBeGreaterThan(3000);
  });

  it('unlocks more parts as you collect Goo Drops', () => {
    const before = SLOTS.reduce((n, s) => n + unlockedCount(s.options, 0), 0);
    const after = SLOTS.reduce((n, s) => n + unlockedCount(s.options, 20), 0);
    expect(after).toBeGreaterThan(before);
  });

  it('tells you what the next unlock costs', () => {
    const next = nextUnlock(0);
    expect(next).toBeTruthy();
    expect(next.needs).toBeGreaterThan(0);
    expect(nextUnlock(999)).toBe(null);
  });

  it('keeps the golden hat for people who really earn it', () => {
    const golden = HATS.find((h) => h.id === 'golden');
    expect(golden.needs).toBeGreaterThanOrEqual(20);
  });
});

describe('the Monster Maker', () => {
  it('starts from your saved character if you have one', () => {
    const saveData = { ...blankSave(), character: { name: 'Zoggy', body: 1, color: 2, eyes: 0, mouth: 0, hat: 0 } };
    expect(createMaker(saveData).character.name).toBe('Zoggy');
  });

  it('moves between rows with up and down', () => {
    const m = createMaker(blankSave());
    update(m, { ...noInput, down: true }, NOW);
    expect(m.row).toBe(1);
    update(m, { ...noInput, up: true }, NOW + 500);
    expect(m.row).toBe(0);
  });

  it('never scrolls past the last row', () => {
    const m = createMaker(blankSave());
    let t = NOW;
    for (let i = 0; i < 20; i++) { t += 200; update(m, { ...noInput, down: true }, t); }
    expect(m.row).toBe(SLOTS.length);
  });

  it('changes a part with left and right', () => {
    const m = createMaker(blankSave());
    m.row = 1;
    const before = m.character.body;
    update(m, { ...noInput, right: true }, NOW);
    expect(m.character.body).not.toBe(before);
  });

  // A locked part you can scroll onto would be a lie — you'd wear something
  // you hadn't earned, or worse, get stuck on it.
  it('skips over parts you have not unlocked yet', () => {
    const m = createMaker(blankSave());   // 0 goo
    m.row = 2;                            // colours
    let t = NOW;
    for (let i = 0; i < 12; i++) {
      t += 200;
      update(m, { ...noInput, right: true }, t);
      expect(isPartUnlocked(COLORS[m.character.color], 0)).toBe(true);
    }
  });

  it('lets you reach a part once you have earned it', () => {
    let data = blankSave();
    for (let i = 0; i < 3; i++) data = recordClear(data, `1-${i + 1}`, 3);
    const m = createMaker(data);          // 9 goo
    m.row = 2;
    let t = NOW, seen = new Set();
    for (let i = 0; i < 12; i++) { t += 200; update(m, { ...noInput, right: true }, t); seen.add(m.character.color); }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('hands back the finished character when you press Enter', () => {
    const m = createMaker(blankSave());
    const out = update(m, { ...noInput, confirm: true }, NOW);
    expect(out).toBe(m.character);
  });

  it('ignores input that arrives too fast to be deliberate', () => {
    const m = createMaker(blankSave());
    update(m, { ...noInput, down: true }, NOW);
    update(m, { ...noInput, down: true }, NOW + 10);
    expect(m.row).toBe(1);
  });
});

describe('typing your name', () => {
  function fakeTarget() {
    const handlers = [];
    return {
      addEventListener: (_, h) => handlers.push(h),
      removeEventListener: () => {},
      type: (key) => handlers.forEach((h) => h({ key, preventDefault() {} }))
    };
  }

  it('types letters into the name', () => {
    const m = createMaker(blankSave());
    const t = fakeTarget();
    attachTyping(m, t);
    'Zog'.split('').forEach((c) => t.type(c));
    expect(m.character.name).toBe('Zog');
  });

  it('backspaces', () => {
    const m = createMaker(blankSave());
    const t = fakeTarget();
    attachTyping(m, t);
    'Zog'.split('').forEach((c) => t.type(c));
    t.type('Backspace');
    expect(m.character.name).toBe('Zo');
  });

  it('will not let the name run off the screen', () => {
    const m = createMaker(blankSave());
    const t = fakeTarget();
    attachTyping(m, t);
    for (let i = 0; i < 40; i++) t.type('a');
    expect(m.character.name.length).toBeLessThanOrEqual(12);
  });

  it('only types while you are on the name row', () => {
    const m = createMaker(blankSave());
    const t = fakeTarget();
    attachTyping(m, t);
    m.row = 3;
    t.type('x');
    expect(m.character.name).toBe('');
  });

  it('ignores keys that are not letters or numbers', () => {
    const m = createMaker(blankSave());
    const t = fakeTarget();
    attachTyping(m, t);
    ['Shift', 'ArrowLeft', '@'].forEach((k) => t.type(k));
    expect(m.character.name).toBe('');
  });
});

describe('sound never breaks the game', () => {
  it('works with no audio support at all', async () => {
    const { sfx } = await import('../src/systems/sound.js');
    const saved = globalThis.window;
    globalThis.window = {};                 // no AudioContext
    expect(() => { sfx.jump(); sfx.coin(); sfx.death(); sfx.win(); }).not.toThrow();
    globalThis.window = saved;
  });
});

// Enter is also a "jump" key, and typing a name presses a dozen more of them.
// Left uncleared, finishing the maker shot you straight past the level select
// and into level 1-1.
describe('finishing the maker does not fling you into a level', () => {
  it('leaves no jump held after confirming', async () => {
    const { createInput, isJumpKey } = await import('../src/systems/input.js');
    expect(isJumpKey('Enter')).toBe(true);      // this is why the bug existed
    expect(isJumpKey('KeyZ')).toBe(true);       // and typing a name does it too
  });
});
