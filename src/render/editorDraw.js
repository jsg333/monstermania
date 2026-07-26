// Drawing for the Level Maker. Kept apart from the editor's logic so the logic
// stays testable without a canvas.

import CONFIG from '../data/config.js';
import {
  TABS, GRID_W, GRID_H, PALETTE_W,
  gridRect, tabRects, toolRects, buttonRects, currentTool
} from '../scenes/editor.js';

const ICON = {
  '1': '#2f6b45', '^': '#7b2fd0', 'S': '#6b5a86', 'f': '#d92d3f',
  'g': '#2f9de0', 'i': '#7dff2e', 'o': '#7ee85a', 'P': '#ffd54a', 'E': '#7dff2e'
};

function chip(ctx, ch, x, y, s) {
  ctx.fillStyle = ICON[ch] || '#2a3b31';
  if (ch === '1') ctx.fillRect(x, y, s, s);
  else if (ch === '^') {
    ctx.beginPath();
    ctx.moveTo(x, y + s); ctx.lineTo(x + s / 2, y + s * 0.25); ctx.lineTo(x + s, y + s);
    ctx.closePath(); ctx.fill();
  } else if (ch === 'P') {
    ctx.fillRect(x + s * 0.25, y + s * 0.15, s * 0.5, s * 0.7);
  } else if (ch === '.') {
    ctx.strokeStyle = '#5e7a68';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
  } else {
    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, s * 0.38, 0, Math.PI * 2);
    ctx.fill();
    if (ch === 'E' || ch === 'i') {
      ctx.fillStyle = '#0a1c07';
      ctx.beginPath();
      ctx.arc(x + s / 2, y + s / 2, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function button(ctx, r, active, colour = '#1b3d29') {
  ctx.fillStyle = active ? '#2f6b45' : colour;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (active) {
    ctx.strokeStyle = '#7dff2e';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
  }
}

export function drawEditor(ctx, ed, view, hover) {
  ctx.fillStyle = '#0d1a13';
  ctx.fillRect(0, 0, view.w, view.h);

  // ---- title ----
  ctx.fillStyle = '#7dff2e';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('LEVEL MAKER', 12, 34);
  ctx.fillStyle = '#5e7a68';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Pick a thing, then draw on the grid', 12, 52);

  // ---- tabs ----
  for (const r of tabRects(view)) {
    button(ctx, r, r.i === ed.tab);
    ctx.fillStyle = r.i === ed.tab ? '#dfffcb' : '#9ecfae';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(r.t.name, r.x + 10, r.y + 19);
  }

  // ---- tools in this tab ----
  for (const r of toolRects(ed, view)) {
    button(ctx, r, r.i === ed.tool);
    chip(ctx, r.tool.ch, r.x + 6, r.y + 5, 18);
    ctx.fillStyle = r.i === ed.tool ? '#dfffcb' : '#9ecfae';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(r.tool.label, r.x + 32, r.y + 19);
  }

  // what the chosen tool does, in plain words
  const tool = currentTool(ed);
  ctx.fillStyle = '#7f9c8a';
  ctx.font = '11px system-ui, sans-serif';
  const hintY = 64 + TABS.length * 34 + 16 + TABS[ed.tab].tools.length * 34 + 14;
  wrap(ctx, tool.hint, 10, hintY, PALETTE_W - 20, 14);

  // ---- buttons ----
  for (const r of buttonRects(view)) {
    button(ctx, r, false, r.id === 'play' ? '#2f6b45' : '#241a1a');
    ctx.fillStyle = r.id === 'play' ? '#dfffcb' : '#b98a8a';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(r.label, r.x + 12, r.y + 20);
  }

  // ---- the grid ----
  const g = gridRect(view);
  const size = CONFIG.TILE * g.scale;
  ctx.fillStyle = '#10241a';
  ctx.fillRect(g.x, g.y, g.w, g.h);

  ctx.strokeStyle = 'rgba(120,160,135,0.10)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= GRID_W; c++) {
    ctx.beginPath(); ctx.moveTo(g.x + c * size, g.y); ctx.lineTo(g.x + c * size, g.y + g.h); ctx.stroke();
  }
  for (let r = 0; r <= GRID_H; r++) {
    ctx.beginPath(); ctx.moveTo(g.x, g.y + r * size); ctx.lineTo(g.x + g.w, g.y + r * size); ctx.stroke();
  }

  for (let r = 0; r < GRID_H; r++) {
    for (let c = 0; c < GRID_W; c++) {
      const ch = ed.grid[r][c];
      if (ch === '.') continue;
      chip(ctx, ch, g.x + c * size + 1, g.y + r * size + 1, size - 2);
    }
  }

  if (hover) {
    ctx.strokeStyle = '#7dff2e';
    ctx.lineWidth = 2;
    ctx.strokeRect(g.x + hover.col * size, g.y + hover.row * size, size, size);
  }

  // ---- is this level any good? ----
  const check = ed.lastCheck;
  const barY = Math.min(view.h - 60, g.y + g.h + 14);
  if (check) {
    if (check.ok && !check.warnings.length) {
      ctx.fillStyle = '#7dff2e';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('✓  This level works — you can finish it!', g.x, barY + 16);
    } else {
      ctx.font = 'bold 13px system-ui, sans-serif';
      let y = barY;
      for (const p of check.problems.slice(0, 2)) {
        ctx.fillStyle = '#ff7a90';
        ctx.fillText('✗  ' + p, g.x, y + 14); y += 18;
      }
      ctx.font = '12px system-ui, sans-serif';
      for (const w of check.warnings.slice(0, 2 - check.problems.length)) {
        ctx.fillStyle = '#ffd54a';
        ctx.fillText('!  ' + w, g.x, y + 14); y += 18;
      }
    }
  }

  if (ed.message) {
    ctx.fillStyle = '#dfffcb';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(ed.message, g.x + g.w - 220, 34);
  }

  ctx.fillStyle = '#5e7a68';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('ESC to leave  ·  your level saves by itself', g.x, view.h - 12);
  ctx.fillText('Drag to draw lots at once', g.x + 260, view.h - 12);
}

function wrap(ctx, text, x, y, maxW, lh) {
  const words = String(text).split(' ');
  let line = '';
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW && line) {
      ctx.fillText(line, x, y); y += lh; line = '';
    }
    line += w + ' ';
  }
  if (line) ctx.fillText(line, x, y);
}
