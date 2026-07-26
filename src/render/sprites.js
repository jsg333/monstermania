// Placeholder art: coloured shapes with a bit of personality. Real art comes
// in Phase 8. Never block a phase on art.
//
// Ethan asked for the monsters to look scarier, and for a rule that you must
// land on TOP of one or his spikes get you. The art has to *show* that rule:
// every monster's top reads as a safe pad, and his sides read as spiky.

import CONFIG from '../data/config.js';
import { isSolid } from '../systems/collision.js';
import { squashAmount, tiredAmount } from '../systems/bouncers.js';
import { BODIES, COLORS, EYES, MOUTHS, HATS } from '../data/parts.js';
import { themeFor } from '../data/themes.js';

export function drawLevel(ctx, level, cam, view, cfg = CONFIG) {
  const T = cfg.TILE;
  const theme = themeFor(level);
  const c0 = Math.max(0, Math.floor(cam.x / T) - 1);
  const c1 = Math.min(level.cols - 1, Math.ceil((cam.x + view.w) / T) + 1);
  const r0 = Math.max(0, Math.floor(cam.y / T) - 1);
  const r1 = Math.min(level.rows - 1, Math.ceil((cam.y + view.h) / T) + 1);

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (level.tiles[r][c] !== 1) continue;
      ctx.fillStyle = theme.block;
      ctx.fillRect(c * T, r * T, T, T);
      if (!isSolid(level, c, r - 1)) {
        ctx.fillStyle = theme.blockTop;
        ctx.fillRect(c * T, r * T, T, 5);
      }
    }
  }
}

// Grump — a grumpy little monster scrunched into a ball of spikes.
export function drawGrump(ctx, g, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const grumble = Math.sin(time / 300 + g.x) * 1.2;

  ctx.fillStyle = '#7b2fd0';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const x = g.x + 2 + i * ((T - 4) / 3);
    const w = (T - 4) / 3;
    ctx.moveTo(x, g.y + T);
    ctx.lineTo(x + w / 2, g.y + T / 2 + grumble);
    ctx.lineTo(x + w, g.y + T);
  }
  ctx.fill();

  ctx.fillStyle = '#ff4d6d';
  ctx.fillRect(g.x + 11, g.y + T - 9, 4, 4);
  ctx.fillRect(g.x + 18, g.y + T - 9, 4, 4);

  ctx.strokeStyle = '#3d1060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x + 9, g.y + T - 13);
  ctx.lineTo(g.x + 15, g.y + T - 10);
  ctx.moveTo(g.x + 23, g.y + T - 13);
  ctx.lineTo(g.x + 17, g.y + T - 10);
  ctx.stroke();
}

// Snoozer — the checkpoint. Deliberately the ONE friendly-looking thing.
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
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    ctx.fillRect(cx - 6, cy - 2, 4, 2);
    ctx.fillRect(cx + 2, cy - 2, 4, 2);
    ctx.fillStyle = '#9d8fb8';
    ctx.font = '9px system-ui';
    ctx.fillText('z', cx + 9, cy - 8 + breathe);
  }
}

// Gogio — a big bouncer with a nasty streak. Spikes around his middle, angry
// glowing eyes, jagged grin. Land on his head and he throws you; touch his
// sides and you're done.
export function drawGogio(ctx, g, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const squash = squashAmount(g, time, cfg);
  const tired = tiredAmount(g, time, cfg);

  const baseH = T * (1 - 0.28 * tired);
  const h = baseH * (1 - 0.45 * squash);
  const w = T * (1 + 0.35 * squash);
  const cx = g.x + T / 2;
  const bottom = g.y + T;
  const cy = bottom - h / 2;

  // side spikes, only around the lower half — matching where they actually hurt
  ctx.fillStyle = '#0d3f63';
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI * (0.05 + (i / 6) * 0.9);
    const px = cx + Math.cos(a) * (w / 2);
    const py = cy + Math.sin(a) * (h / 2);
    ctx.beginPath();
    ctx.moveTo(px - Math.sin(a) * 3.5, py + Math.cos(a) * 3.5);
    ctx.lineTo(px + Math.cos(a) * 7, py + Math.sin(a) * 7);
    ctx.lineTo(px + Math.sin(a) * 3.5, py - Math.cos(a) * 3.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = tired > 0.6 ? '#1c6ea3' : '#2f9de0';
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyeY = bottom - h * 0.64;
  ctx.strokeStyle = '#05243a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 10, eyeY - 5);
  ctx.lineTo(cx - 3, eyeY - 1);
  ctx.moveTo(cx + 10, eyeY - 5);
  ctx.lineTo(cx + 3, eyeY - 1);
  ctx.stroke();

  ctx.fillStyle = tired > 0.6 ? '#7fd0ff' : '#fff6a8';
  ctx.beginPath(); ctx.arc(cx - 6, eyeY + 2, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 6, eyeY + 2, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#05243a';
  ctx.beginPath(); ctx.arc(cx - 5.4, eyeY + 2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 6.6, eyeY + 2, 1.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#05243a';
  ctx.beginPath();
  const my = bottom - h * 0.34;
  ctx.moveTo(cx - 8, my);
  for (let i = 0; i < 4; i++) {
    ctx.lineTo(cx - 8 + (i + 0.5) * 4, my + 4);
    ctx.lineTo(cx - 8 + (i + 1) * 4, my);
  }
  ctx.closePath();
  ctx.fill();

  if (tired >= 0.99) {
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.font = '9px system-ui';
    ctx.fillText('huff', cx + 11, bottom - h - 3);
  }
}

// Fungy — a mushroom with teeth. The cap is safe to land on; the ring of
// spines underneath is not.
export function drawFungy(ctx, f, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const squash = squashAmount(f, time, cfg);
  const capH = T * 0.52 * (1 - 0.4 * squash);
  const capW = T * (0.94 + 0.3 * squash);
  const cx = f.x + T / 2;
  const bottom = f.y + T;
  const capY = bottom - T * 0.44;

  ctx.fillStyle = '#d8c9a6';
  ctx.fillRect(cx - 6, capY, 12, T * 0.44);

  ctx.fillStyle = '#7a1420';
  for (let i = -3; i <= 3; i++) {
    const px = cx + i * 4.6;
    ctx.beginPath();
    ctx.moveTo(px - 2.4, capY);
    ctx.lineTo(px, capY + 7);
    ctx.lineTo(px + 2.4, capY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#d92d3f';
  ctx.beginPath();
  ctx.ellipse(cx, capY, capW / 2, capH, 0, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = '#ffe2e2';
  ctx.beginPath(); ctx.arc(cx - 8, capY - capH * 0.45, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7, capY - capH * 0.58, 2.1, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#3a2a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 6, capY + 10); ctx.lineTo(cx - 2, capY + 12);
  ctx.moveTo(cx + 6, capY + 10); ctx.lineTo(cx + 2, capY + 12);
  ctx.stroke();

  ctx.fillStyle = '#3a2a12';
  ctx.fillRect(cx - 5, capY + 13, 3, 3);
  ctx.fillRect(cx + 2, capY + 13, 3, 3);

  ctx.beginPath();
  ctx.arc(cx, capY + 24, 4, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
}

// A Goo Drop — a spinning coin you collect for character perks.
export function drawGooDrop(ctx, d, time, cfg = CONFIG) {
  if (d.taken) return;
  const T = cfg.TILE;
  const cx = d.x + T / 2;
  const cy = d.y + T / 2 + Math.sin(time / 380) * 3;
  const spin = Math.abs(Math.cos((time / cfg.GOO_SPIN_MS) * Math.PI * 2));

  ctx.save();
  ctx.shadowColor = '#9cff6b';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#7ee85a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(1.5, 10 * spin), 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#cffcb8';
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.8, 5 * spin), 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Ickio — vibrant lime green, with a hole you can actually see. Ethan's
// invention, and the star of the game.
export function drawIckio(ctx, ick, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const cx = ick.x + T / 2;
  const cy = ick.y + T / 2;
  const wobble = 1 + Math.sin(time / 420 + ick.x) * 0.05;

  ctx.fillStyle = '#7dff2e';
  ctx.beginPath();
  ctx.ellipse(cx, cy, (T / 2) * wobble, (T / 2) / wobble, 0, 0, Math.PI * 2);
  ctx.fill();

  // the hole — drawn dark and slightly inset so it reads as a hole, not a dot
  ctx.fillStyle = '#0a1c07';
  ctx.beginPath();
  ctx.ellipse(cx, cy, cfg.ICKIO_HOLE / 2, (cfg.ICKIO_HOLE / 2) * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b6ff86';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, cfg.ICKIO_HOLE / 2, (cfg.ICKIO_HOLE / 2) * 0.92, 0, Math.PI, 0);
  ctx.stroke();

  // two little eyes above the hole so he reads as a monster
  ctx.fillStyle = '#0a1c07';
  ctx.beginPath(); ctx.arc(cx - 8, cy - 11, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8, cy - 11, 2, 0, Math.PI * 2); ctx.fill();
}

// Big Ickio — the level exit. Dive in to win.
export function drawBigIckio(ctx, exit, time, cfg = CONFIG) {
  const T = cfg.TILE;
  const cx = exit.x + T / 2;
  const cy = exit.y + T / 2;
  const pulse = 1 + Math.sin(time / 300) * 0.06;
  const R = T * 0.85 * pulse;

  ctx.save();
  ctx.shadowColor = '#7dff2e';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#7dff2e';
  ctx.beginPath();
  ctx.ellipse(cx, cy, R, R * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#081706';
  ctx.beginPath();
  ctx.ellipse(cx, cy, R * 0.6, R * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#081706';
  ctx.beginPath(); ctx.arc(cx - 15, cy - 20, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 15, cy - 20, 3.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#dfffcb';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DIVE IN!', cx, cy - R - 6);
  ctx.textAlign = 'left';
}

// Draw a character the player built in the Monster Maker. Used for the
// player sprite in-game and for the big preview in the maker itself.
export function drawCharacter(ctx, ch, x, y, w, h, facing = 1) {
  const body = BODIES[ch.body] || BODIES[0];
  const colour = (COLORS[ch.color] || COLORS[0]).id;
  const eyes = (EYES[ch.eyes] || EYES[0]).id;
  const mouth = (MOUTHS[ch.mouth] || MOUTHS[0]).id;
  const hat = (HATS[ch.hat] || HATS[0]).id;

  const cx = x + w / 2;
  ctx.fillStyle = colour;

  if (body.id === 'round') {
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.55, w * 0.5, h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (body.id === 'tall') {
    ctx.fillRect(x + w * 0.15, y, w * 0.7, h);
  } else if (body.id === 'blob') {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x - w * 0.1, y + h * 0.2, cx, y);
    ctx.quadraticCurveTo(x + w * 1.1, y + h * 0.2, x + w, y + h);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }

  const ex = cx + facing * w * 0.10;
  const ey = y + h * 0.34;
  const s = w / 24;                       // scale everything off a 24px-wide body

  ctx.fillStyle = '#14140f';
  if (eyes === 'big') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex - 4 * s, ey, 4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 4 * s, ey, 4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#14140f';
    ctx.beginPath(); ctx.arc(ex - 3 * s, ey, 2 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 5 * s, ey, 2 * s, 0, Math.PI * 2); ctx.fill();
  } else if (eyes === 'angry') {
    ctx.strokeStyle = '#14140f';
    ctx.lineWidth = Math.max(1.5, 2 * s);
    ctx.beginPath();
    ctx.moveTo(ex - 7 * s, ey - 4 * s); ctx.lineTo(ex - 2 * s, ey - 1 * s);
    ctx.moveTo(ex + 7 * s, ey - 4 * s); ctx.lineTo(ex + 2 * s, ey - 1 * s);
    ctx.stroke();
    ctx.fillRect(ex - 6 * s, ey, 3 * s, 3 * s);
    ctx.fillRect(ex + 3 * s, ey, 3 * s, 3 * s);
  } else if (eyes === 'sleepy') {
    ctx.fillRect(ex - 7 * s, ey, 5 * s, 1.6 * s);
    ctx.fillRect(ex + 2 * s, ey, 5 * s, 1.6 * s);
  } else {
    ctx.fillRect(ex - 5 * s, ey, 2.6 * s, 3.2 * s);
    ctx.fillRect(ex + 2 * s, ey, 2.6 * s, 3.2 * s);
  }

  const my = y + h * 0.58;
  ctx.fillStyle = '#14140f';
  ctx.strokeStyle = '#14140f';
  ctx.lineWidth = Math.max(1.2, 1.6 * s);
  if (mouth === 'grin') {
    ctx.beginPath(); ctx.arc(cx, my - 2 * s, 5 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else if (mouth === 'fangs') {
    ctx.beginPath();
    ctx.moveTo(cx - 5 * s, my); ctx.lineTo(cx - 2.5 * s, my + 4 * s); ctx.lineTo(cx, my);
    ctx.lineTo(cx + 2.5 * s, my + 4 * s); ctx.lineTo(cx + 5 * s, my);
    ctx.closePath(); ctx.fill();
  } else if (mouth === 'ooh') {
    ctx.beginPath(); ctx.arc(cx, my, 3 * s, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(cx, my - 1 * s, 4 * s, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  }

  if (hat === 'cap') {
    ctx.fillStyle = '#e6473c';
    ctx.fillRect(x + w * 0.1, y - 4 * s, w * 0.8, 4 * s);
    ctx.fillRect(x + w * 0.1 + facing * w * 0.3, y - 1.5 * s, w * 0.45, 2 * s);
  } else if (hat === 'antenna') {
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = Math.max(1.2, 1.6 * s);
    ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 8 * s); ctx.stroke();
    ctx.fillStyle = '#7dff2e';
    ctx.beginPath(); ctx.arc(cx, y - 9.5 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
  } else if (hat === 'horns') {
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath(); ctx.moveTo(cx - 8 * s, y); ctx.lineTo(cx - 10 * s, y - 8 * s); ctx.lineTo(cx - 4 * s, y - 1 * s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 8 * s, y); ctx.lineTo(cx + 10 * s, y - 8 * s); ctx.lineTo(cx + 4 * s, y - 1 * s); ctx.fill();
  } else if (hat === 'crown' || hat === 'golden') {
    ctx.fillStyle = hat === 'golden' ? '#ffd700' : '#ffcf4d';
    ctx.beginPath();
    ctx.moveTo(cx - 8 * s, y);
    ctx.lineTo(cx - 8 * s, y - 6 * s); ctx.lineTo(cx - 4 * s, y - 2.5 * s);
    ctx.lineTo(cx, y - 7 * s); ctx.lineTo(cx + 4 * s, y - 2.5 * s);
    ctx.lineTo(cx + 8 * s, y - 6 * s); ctx.lineTo(cx + 8 * s, y);
    ctx.closePath(); ctx.fill();
    if (hat === 'golden') {
      ctx.strokeStyle = '#fff6c2'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
}

export function drawPlayer(ctx, p, character) {
  if (character) {
    drawCharacter(ctx, character, p.x, p.y, p.w, p.h, p.facing);
    return;
  }
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
