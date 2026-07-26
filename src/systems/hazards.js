// Grumps, Snoozers, dying and coming back. All pure functions.

import CONFIG from '../data/config.js';

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const box = (o, w, h, ox = 0, oy = 0) => ({ x: o.x + ox, y: o.y + oy, w, h });

// A Grump's spikes only fill the bottom of its tile, and we shrink the box a
// little on every side. Generous hitboxes matter: nothing makes a player
// angrier than dying to a spike they were sure they cleared.
export function grumpBox(g, cfg = CONFIG) {
  const T = cfg.TILE;
  const inset = cfg.HAZARD_FORGIVENESS;
  return box(g, T - inset * 2, T / 2 - inset, inset, T / 2 + inset);
}

export function snoozerBox(s, cfg = CONFIG) {
  const T = cfg.TILE;
  return box(s, T, T, 0, 0);
}

export function playerBox(p) {
  return { x: p.x, y: p.y, w: p.w, h: p.h };
}

export function touchingGrump(player, level, cfg = CONFIG) {
  const pb = playerBox(player);
  return level.grumps.some((g) => overlaps(pb, grumpBox(g, cfg)));
}

export function fellOutOfWorld(player, level, cfg = CONFIG) {
  return player.y > level.heightPx + cfg.TILE * 2;
}

export function isDeadly(player, level, cfg = CONFIG) {
  return touchingGrump(player, level, cfg) || fellOutOfWorld(player, level, cfg);
}

// Walk into a Snoozer and he wakes up. Returns the checkpoint you should
// respawn at, and whether one just woke up (so we can play a sound later).
export function updateSnoozers(player, level, checkpoint, cfg = CONFIG) {
  const pb = playerBox(player);
  let next = checkpoint;
  let justWoke = null;

  for (const s of level.snoozers) {
    if (s.awake) continue;
    if (overlaps(pb, snoozerBox(s, cfg))) {
      s.awake = true;
      justWoke = s;
      next = { x: s.x + 4, y: s.y };
    }
  }
  return { checkpoint: next, justWoke };
}

export function respawn(player, checkpoint) {
  return { ...player, x: checkpoint.x, y: checkpoint.y, vx: 0, vy: 0, onGround: false, jumping: false };
}

// A little puff of smoke so dying is funny instead of punishing.
export function makePuff(player, count = 14) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 90 + Math.random() * 140;
    return { x: cx, y: cy, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 60, life: 1 };
  });
}

export function stepPuff(particles, dt) {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + 420 * dt,
      life: p.life - dt * 2.2
    }))
    .filter((p) => p.life > 0);
}
