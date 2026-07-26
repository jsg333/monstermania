// Tile collision. Move on one axis at a time — it's the simplest way to
// avoid getting stuck in corners, and it's easy to test.
//
// Why the substepping: if you're falling fast enough to cross a whole block
// in one frame, a naive check looks at where you LANDED and sees empty air,
// so you fall straight through the floor. Ickio launches you at exactly those
// speeds, so this matters a lot in this game. We break big moves into pieces
// smaller than one tile and check each piece.

import CONFIG from '../data/config.js';

export function isSolid(level, col, row) {
  if (row < 0 || row >= level.tiles.length) return false;
  if (col < 0 || col >= level.tiles[0].length) return false;
  return level.tiles[row][col] === 1;
}

function tileRange(min, max, size) {
  return [Math.floor(min / size), Math.floor((max - 0.001) / size)];
}

function stepOnce(p, level, dt, T) {
  let { x, y, vx, vy, w, h } = p;
  let onGround = false;

  // --- horizontal ---
  x += vx * dt;
  {
    const [r0, r1] = tileRange(y, y + h, T);
    if (vx > 0) {
      const col = Math.floor((x + w - 0.001) / T);
      for (let r = r0; r <= r1; r++) {
        if (isSolid(level, col, r)) { x = col * T - w; vx = 0; break; }
      }
    } else if (vx < 0) {
      const col = Math.floor(x / T);
      for (let r = r0; r <= r1; r++) {
        if (isSolid(level, col, r)) { x = (col + 1) * T; vx = 0; break; }
      }
    }
  }

  // --- vertical ---
  y += vy * dt;
  {
    const [c0, c1] = tileRange(x, x + w, T);
    if (vy > 0) {
      const row = Math.floor((y + h - 0.001) / T);
      for (let c = c0; c <= c1; c++) {
        if (isSolid(level, c, row)) { y = row * T - h; vy = 0; onGround = true; break; }
      }
    } else if (vy < 0) {
      const row = Math.floor(y / T);
      for (let c = c0; c <= c1; c++) {
        if (isSolid(level, c, row)) { y = (row + 1) * T; vy = 0; break; }
      }
    }
  }

  return { ...p, x, y, vx, vy, onGround };
}

export function moveAndCollide(player, level, dt, cfg = CONFIG) {
  const T = cfg.TILE;
  const distance = Math.max(Math.abs(player.vx), Math.abs(player.vy)) * dt;
  const steps = Math.max(1, Math.ceil(distance / (T * 0.5)));
  const slice = dt / steps;

  let p = player;
  let onGround = false;
  for (let i = 0; i < steps; i++) {
    p = stepOnce(p, level, slice, T);
    if (p.onGround) onGround = true;
    // Nothing left to move? Stop early.
    if (p.vx === 0 && p.vy === 0) break;
  }
  return { ...p, onGround };
}
