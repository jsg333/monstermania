// THE LEVEL MAKER — Ethan's original idea, in his own words:
//
//   "objects are sorted into different tabs like monsters, hazards, and
//    platforms"
//
// Pick a thing from a tab, paint it onto the grid, press PLAY. The big
// difference from a plain drawing tool: it checks whether your level can
// actually be FINISHED and tells you before you share it with anyone.

import CONFIG from '../data/config.js';
import { parseLevel } from '../data/levels/format.js';
import { checkLevel } from '../systems/solver.js';

export const TABS = [
  {
    name: 'Platforms',
    tools: [
      { ch: '1', label: 'Block', hint: 'Solid ground. Flat on top.' },
      { ch: '.', label: 'Rubber', hint: 'Erase — takes things away.' }
    ]
  },
  {
    name: 'Monsters',
    tools: [
      { ch: 'f', label: 'Fungy', hint: 'Throws you FORWARD a long way.' },
      { ch: 'g', label: 'Gogio', hint: 'Throws you UP. Needs clear sky above!' },
      { ch: 'i', label: 'Ickio', hint: 'Put TWO — they join up.' },
      { ch: 'S', label: 'Snoozer', hint: 'Checkpoint. Needs ground under him.' }
    ]
  },
  {
    name: 'Hazards',
    tools: [{ ch: '^', label: 'Grump', hint: 'Spikes. Touch him and you’re out.' }]
  },
  {
    name: 'Bits',
    tools: [
      { ch: 'o', label: 'Goo Drop', hint: 'A coin to collect.' },
      { ch: 'P', label: 'Start', hint: 'Where you begin. Only one.' },
      { ch: 'E', label: 'Big Ickio', hint: 'The exit! Dive in to win.' }
    ]
  }
];

export const GRID_W = 44;
export const GRID_H = 22;

export function blankGrid(w = GRID_W, h = GRID_H) {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  for (let r = 0; r < h; r++) { g[r][0] = '1'; g[r][w - 1] = '1'; }
  for (let c = 0; c < w; c++) g[h - 2][c] = '1';       // a floor to stand on
  g[h - 3][2] = 'P';
  return g;
}

export function createEditor(saved) {
  return {
    grid: saved ? saved.map((row) => [...row]) : blankGrid(),
    tab: 0,
    tool: 0,
    lastCheck: null,
    message: '',
    messageUntil: 0
  };
}

export function toMap(ed) {
  return ed.grid.map((row) => row.join('')).join('\n');
}

// Only ONE start and ONE exit make sense, so placing a new one moves it.
function unique(ed, ch) {
  for (const row of ed.grid) {
    for (let c = 0; c < row.length; c++) if (row[c] === ch) row[c] = '.';
  }
}

export function paint(ed, col, row, ch) {
  if (row < 0 || row >= ed.grid.length || col < 0 || col >= ed.grid[0].length) return false;
  if (col === 0 || col === ed.grid[0].length - 1) return false;   // keep the walls
  if (ch === 'P' || ch === 'E') unique(ed, ch);
  ed.grid[row][col] = ch;
  return true;
}

export function currentTool(ed) {
  return TABS[ed.tab].tools[ed.tool] || TABS[ed.tab].tools[0];
}

// Try to turn the drawing into a real level. Returns null if it can't even be
// parsed (no start point, odd number of Ickios).
export function tryBuild(ed, name = 'My Level') {
  try {
    return parseLevel(name, toMap(ed), undefined, { id: 'custom', title: name, theme: 'slimeLab' });
  } catch (err) {
    return { error: err.message };
  }
}

export function validate(ed) {
  const built = tryBuild(ed);
  if (built && built.error) {
    return { ok: false, problems: [built.error], warnings: [] };
  }
  return checkLevel(built);
}

// --- layout ------------------------------------------------------------
export const PALETTE_W = 168;

export function gridRect(view) {
  const pad = 14;
  const x = PALETTE_W + pad;
  const y = 64;
  const w = view.w - x - pad;
  const h = view.h - y - 96;
  const scale = Math.min(w / (GRID_W * CONFIG.TILE), h / (GRID_H * CONFIG.TILE));
  return { x, y, scale, w: GRID_W * CONFIG.TILE * scale, h: GRID_H * CONFIG.TILE * scale };
}

export function cellAt(view, px, py) {
  const g = gridRect(view);
  const size = CONFIG.TILE * g.scale;
  const col = Math.floor((px - g.x) / size);
  const row = Math.floor((py - g.y) / size);
  if (col < 0 || col >= GRID_W || row < 0 || row >= GRID_H) return null;
  return { col, row };
}

export function tabRects(view) {
  return TABS.map((t, i) => ({ t, i, x: 8, y: 64 + i * 34, w: PALETTE_W - 16, h: 28 }));
}

export function toolRects(ed, view) {
  const tools = TABS[ed.tab].tools;
  const top = 64 + TABS.length * 34 + 16;
  return tools.map((tool, i) => ({ tool, i, x: 8, y: top + i * 34, w: PALETTE_W - 16, h: 28 }));
}

export function buttonRects(view) {
  const y = view.h - 76;
  return [
    { id: 'play', label: '▶  PLAY IT', x: 8, y, w: PALETTE_W - 16, h: 30 },
    { id: 'clear', label: 'Start over', x: 8, y: y + 36, w: PALETTE_W - 16, h: 26 }
  ];
}
