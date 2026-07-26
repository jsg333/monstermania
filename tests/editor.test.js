import { describe, it, expect, beforeEach } from 'vitest';
import {
  TABS, GRID_W, GRID_H, blankGrid, createEditor, toMap, paint,
  currentTool, tryBuild, validate, cellAt, tabRects, toolRects, buttonRects
} from '../src/scenes/editor.js';
import CONFIG from '../src/data/config.js';

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

// Ethan's words, from the very first thing he wrote about this game:
// "objects are sorted into different tabs like monsters, hazards, and platforms"
describe('the tabs Ethan asked for', () => {
  it('has Platforms, Monsters and Hazards', () => {
    const names = TABS.map((t) => t.name);
    expect(names).toContain('Platforms');
    expect(names).toContain('Monsters');
    expect(names).toContain('Hazards');
  });

  it('puts every monster in the Monsters tab', () => {
    const monsters = TABS.find((t) => t.name === 'Monsters').tools.map((x) => x.ch);
    expect(monsters).toEqual(expect.arrayContaining(['f', 'g', 'i', 'S']));
  });

  it('explains what each tool does in plain words', () => {
    for (const tab of TABS) {
      for (const tool of tab.tools) {
        expect(tool.hint.length, `${tool.label} needs a hint`).toBeGreaterThan(8);
        expect(tool.label.length).toBeLessThan(12);
      }
    }
  });
});

describe('drawing a level', () => {
  it('starts you off with a floor and a start point, not a blank void', () => {
    const ed = createEditor();
    expect(toMap(ed)).toContain('P');
    expect(ed.grid[GRID_H - 2].filter((c) => c === '1').length).toBeGreaterThan(GRID_W / 2);
  });

  it('paints what the chosen tool is', () => {
    const ed = createEditor();
    ed.tab = TABS.findIndex((t) => t.name === 'Hazards');
    ed.tool = 0;
    paint(ed, 5, 5, currentTool(ed).ch);
    expect(ed.grid[5][5]).toBe('^');
  });

  it('rubs things out', () => {
    const ed = createEditor();
    paint(ed, 6, 6, '1');
    paint(ed, 6, 6, '.');
    expect(ed.grid[6][6]).toBe('.');
  });

  it('keeps the side walls, so you cannot fall out of your own level', () => {
    const ed = createEditor();
    expect(paint(ed, 0, 5, '.')).toBe(false);
    expect(paint(ed, GRID_W - 1, 5, '.')).toBe(false);
    expect(ed.grid[5][0]).toBe('1');
  });

  it('moves the start point rather than making a second one', () => {
    const ed = createEditor();
    paint(ed, 10, 5, 'P');
    paint(ed, 20, 5, 'P');
    const count = toMap(ed).split('').filter((c) => c === 'P').length;
    expect(count).toBe(1);
    expect(ed.grid[5][20]).toBe('P');
  });

  it('does the same for the exit', () => {
    const ed = createEditor();
    paint(ed, 10, 5, 'E');
    paint(ed, 22, 5, 'E');
    expect(toMap(ed).split('').filter((c) => c === 'E').length).toBe(1);
  });
});

// The point of the whole thing: tell him the level is broken while he's
// building it, not after he's given it to a friend.
describe('it tells you when your level is broken', () => {
  const withFloorAndStart = () => {
    const ed = createEditor();
    return ed;
  };

  it('says so when there is no exit', () => {
    const check = validate(withFloorAndStart());
    expect(check.ok).toBe(false);
    expect(check.problems.join(' ')).toMatch(/Big Ickio/);
  });

  it('is happy with a simple, finishable level', () => {
    const ed = withFloorAndStart();
    paint(ed, 10, GRID_H - 3, 'E');
    const check = validate(ed);
    expect(check.ok, check.problems.join(' | ')).toBe(true);
  });

  it('catches an exit nobody can reach', () => {
    const ed = withFloorAndStart();
    paint(ed, 30, 2, 'E');                       // floating miles up
    const check = validate(ed);
    expect(check.ok).toBe(false);
    expect(check.problems.join(' ')).toMatch(/can’t reach/i);
  });

  it('catches a Gogio with a platform over his head', () => {
    const ed = withFloorAndStart();
    paint(ed, 10, GRID_H - 3, 'E');
    paint(ed, 20, GRID_H - 3, 'g');
    for (let c = 18; c < 23; c++) paint(ed, c, GRID_H - 9, '1');
    const check = validate(ed);
    expect(check.problems.join(' ')).toMatch(/bonk/i);
  });

  it('catches a floating Snoozer, the bug that made a level unwinnable', () => {
    const ed = withFloorAndStart();
    paint(ed, 10, GRID_H - 3, 'E');
    paint(ed, 25, 6, 'S');                       // hanging in mid-air
    const check = validate(ed);
    expect(check.problems.join(' ')).toMatch(/floating/i);
  });

  it('catches an odd number of Ickios', () => {
    const ed = withFloorAndStart();
    paint(ed, 10, GRID_H - 3, 'E');
    paint(ed, 15, GRID_H - 3, 'i');
    const check = validate(ed);
    expect(check.ok).toBe(false);
    expect(check.problems.join(' ')).toMatch(/pairs/i);
  });

  it('warns about coins you cannot get to, without blocking you', () => {
    const ed = withFloorAndStart();
    paint(ed, 10, GRID_H - 3, 'E');
    paint(ed, 30, 1, 'o');
    const check = validate(ed);
    expect(check.warnings.join(' ')).toMatch(/Goo Drop/);
  });
});

describe('turning a drawing into a real level', () => {
  it('builds something the game can actually play', () => {
    const ed = createEditor();
    paint(ed, 12, GRID_H - 3, 'E');
    const level = tryBuild(ed, 'Test');
    expect(level.error).toBeUndefined();
    expect(level.spawn).toBeTruthy();
    expect(level.exit).toBeTruthy();
    expect(level.title).toBe('Test');
  });

  it('refuses politely when there is no start point', () => {
    const ed = createEditor();
    for (const row of ed.grid) {
      for (let c = 0; c < row.length; c++) if (row[c] === 'P') row[c] = '.';
    }
    expect(tryBuild(ed).error).toMatch(/no P/);
  });
});

describe('the layout is clickable', () => {
  it('turns a screen position into a grid square', () => {
    expect(cellAt(view, 0, 0)).toBe(null);          // over the palette
    const cell = cellAt(view, 600, 300);
    expect(cell).toBeTruthy();
    expect(cell.col).toBeGreaterThanOrEqual(0);
    expect(cell.col).toBeLessThan(GRID_W);
  });

  it('never overlaps the tabs, tools and buttons', () => {
    const ed = createEditor();
    const all = [...tabRects(view), ...toolRects(ed, view), ...buttonRects(view)];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        expect(overlap, `${i} overlaps ${j}`).toBe(false);
      }
    }
  });
});
