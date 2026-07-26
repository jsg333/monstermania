// Placeholder art: coloured shapes with a bit of personality. Real art comes
// in Phase 8. Never block a phase on art.

import CONFIG from '../data/config.js';
import { isSolid } from '../systems/collision.js';
import { squashAmount, tiredAmount } from '../systems/bouncers.js';

export function drawLevel(ctx, level, cam, view, cfg = CONFIG) {
  const T = cfg.TILE;
  const c0 = Math.max(0, Math.floor(cam.x / T) - 1);
  const c1 = Math.min(level.cols - 1, Math.ceil((cam.x + view.w) / T) + 1);
  const r0 = Math.max(0, Math.floor(cam.y / T) - 1);
  const r1 = Math.min(level.rows - 1, Math.ceil((cam.y + view.h) / T) + 1);

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (level.tiles[r][c] !== 1) continue;
      ctx.fillStyle = '#2f6b45';
      ctx.fillRect(c * T, r * T, T, T);
      if (!isSolid(level, c, r - 1)) {
        ctx.fillStyle = '#4ea86a';
        ctx.fillRect(c * T, r * T, T, 5);
      }
    }
  }
}

export function drawGrump(ctx, g, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const grumble = Math.sin(time / 300 + g.x) * 1.2; // he fidgets, grumpily
  ctx.fillStyle = '#8f4bd6';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const x = g.x + 2 + i * ((T - 4) / 3);
    const w = (T - 4) / 3;
    ctx.moveTo(x, g.y + T);
    ctx.lineTo(x + w / 2, g.y + T / 2 + grumble);
    ctx.lineTo(x + w, g.y + T);
  }
  ctx.fill();
  ctx.fillStyle = '#f2e9ff';
  ctx.fillRect(g.x + 11, g.y + T - 9, 4, 4);
  ctx.fillRect(g.x + 18, g.y + T - 9, 4, 4);
}

export function drawSnoozer(ctx, s, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const breathe = Math.sin(time / 500) * 1.5;
  const cx = s.x + T / 2;
  const cy = s.y + T - 10 + (s.awake ? -2 : breathe);

  ctx.fillStyle = s.awake ? '#c58bff' : '#6b5a86';
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1b1b1b';
  if (s.awake) {
    ctx.fillRect(cx - 5, cy - 3, 3, 3);
    ctx.fillRect(cx + 2, cy - 3, 3, 3);
    ctx.beginPath();               // a smile, because you're safe now
    ctx.arc(cx, cy + 1, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    ctx.fillRect(cx - 6, cy - 2, 4, 2); // closed eyes
    ctx.fillRect(cx + 2, cy - 2, 4, 2);
    ctx.fillStyle = '#9d8fb8';
    ctx.font = '9px system-ui';
    ctx.fillText('z', cx + 9, cy - 8 + breathe);
  }
}

export function drawPlayer(ctx, p) {
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = '#1b1b1b';
  const eyeX = p.x + (p.facing > 0 ? 14 : 4);
  ctx.fillRect(eyeX, p.y + 8, 5, 6);
}

export function drawPuff(ctx, particles) {
  for (const q of particles) {
    ctx.globalAlpha = Math.max(0, q.life);
    ctx.fillStyle = '#9cff6b';
    ctx.fillRect(q.x - 3, q.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}

// Gogio — a big round bouncer. He squashes when you land on him and stays
// flatter each time until he gets a breather.
export function drawGogio(ctx, g, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const squash = squashAmount(g, time, cfg);
  const tired = tiredAmount(g, time, cfg);

  const baseH = T * (1 - 0.28 * tired);
  const h = baseH * (1 - 0.45 * squash);
  const w = T * (1 + 0.35 * squash);
  const cx = g.x + T / 2;
  const bottom = g.y + T;

  ctx.fillStyle = tired > 0.6 ? '#2f8fd6' : '#39b0ff';
  ctx.beginPath();
  ctx.ellipse(cx, bottom - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#06263d';
  const eyeY = bottom - h * 0.62;
  ctx.fillRect(cx - 7, eyeY, 4, tired > 0.6 ? 2 : 5);
  ctx.fillRect(cx + 3, eyeY, 4, tired > 0.6 ? 2 : 5);

  // Little puff lines while he catches his breath.
  if (tired >= 0.99) {
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '9px system-ui';
    ctx.fillText('huff', cx + 10, bottom - h - 3);
  }
}

// Fungy — a mushroom. Same hop every time, never tires.
export function drawFungy(ctx, f, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const squash = squashAmount(f, time, cfg);
  const capH = T * 0.5 * (1 - 0.4 * squash);
  const capW = T * (0.92 + 0.3 * squash);
  const cx = f.x + T / 2;
  const bottom = f.y + T;

  ctx.fillStyle = '#e8dcc0';                       // stalk
  ctx.fillRect(cx - 5, bottom - T * 0.5, 10, T * 0.5);

  ctx.fillStyle = '#ff6b6b';                       // cap
  ctx.beginPath();
  ctx.ellipse(cx, bottom - T * 0.5, capW / 2, capH, 0, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = '#fff0f0';                       // spots
  ctx.beginPath(); ctx.arc(cx - 7, bottom - T * 0.62, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 6, bottom - T * 0.68, 2, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#1b1b1b';                       // face on the stalk
  ctx.fillRect(cx - 4, bottom - T * 0.34, 2, 3);
  ctx.fillRect(cx + 2, bottom - T * 0.34, 2, 3);
}
