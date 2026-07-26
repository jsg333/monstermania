import { describe, it, expect, beforeEach } from 'vitest';
import { blankSave, load, save, recordClear, isUnlocked, totalGoo } from '../src/systems/save.js';

const store = new Map();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k)
  };
});

const levels = [{ id: '1-1' }, { id: '1-2' }, { id: '1-3' }];

describe('saving progress', () => {
  it('starts empty', () => {
    expect(load()).toEqual(blankSave());
  });

  it('remembers a cleared level across a reload', () => {
    recordClear(blankSave(), '1-1', 2);
    expect(load().cleared['1-1']).toBe(true);
    expect(load().gooDrops['1-1']).toBe(2);
  });

  it('keeps your best Goo Drop count, never a worse one', () => {
    let data = recordClear(blankSave(), '1-1', 3);
    data = recordClear(data, '1-1', 1);
    expect(data.gooDrops['1-1']).toBe(3);
  });

  it('adds up Goo Drops across levels', () => {
    let data = recordClear(blankSave(), '1-1', 2);
    data = recordClear(data, '1-2', 3);
    expect(totalGoo(data)).toBe(5);
  });

  it('survives corrupted storage instead of crashing', () => {
    store.set('monstermania.save.v1', '{not json');
    expect(load()).toEqual(blankSave());
  });

  it('still works with no storage at all', () => {
    delete globalThis.localStorage;
    expect(() => save(blankSave())).not.toThrow();
    expect(load()).toEqual(blankSave());
  });
});

describe('unlocking levels', () => {
  it('always lets you play the first one', () => {
    expect(isUnlocked(blankSave(), levels, 0)).toBe(true);
  });

  it('keeps later levels locked until you clear the one before', () => {
    expect(isUnlocked(blankSave(), levels, 1)).toBe(false);
    const data = recordClear(blankSave(), '1-1', 0);
    expect(isUnlocked(data, levels, 1)).toBe(true);
    expect(isUnlocked(data, levels, 2)).toBe(false);
  });
});
