// BOSS: BIG GOGIO — Ethan's design.
//
//   "Big Gogio moves around a lot. If you tap him in time, his health
//    decreases."  ... and tapping means LANDING ON HIS HEAD, not clicking.
//
// The one rule that makes a boss fair: he squishes down for half a second
// before every leap. That wind-up is the player's warning. A boss with no
// tell just feels random.

import CONFIG from '../data/config.js';
import { overlaps, playerBox } from './hazards.js';

export function createBoss(level, cfg = CONFIG) {
  const T = cfg.TILE;
  return {
    x: level.cols * T * 0.6,
    y: (level.rows - 4) * T - T * 2,
    w: T * 2, h: T * 2,
    vx: 0, vy: 0,
    health: cfg.BOSS_HEALTH,
    windupUntil: 0,
    nextLeapAt: 0,
    hurtUntil: 0,
    defeated: false
  };
}

export function bossBox(b) {
  return { x: b.x, y: b.y, w: b.w, h: b.h };
}

// His head is the only safe part, same rule as every other monster.
export function bossHeadBox(b, cfg = CONFIG) {
  return { x: b.x + 6, y: b.y, w: b.w - 12, h: b.h * cfg.LANDING_BAND * 0.5 };
}

export function speedFor(health, cfg = CONFIG) {
  const hitsTaken = cfg.BOSS_HEALTH - health;
  return Math.pow(cfg.BOSS_SPEEDUP_PER_HIT, hitsTaken);
}

export function isWindingUp(b, now) {
  return now < b.windupUntil;
}

export function stepBoss(boss, player, level, dt, now, cfg = CONFIG) {
  const b = { ...boss };
  if (b.defeated) return b;

  const T = cfg.TILE;
  const floorY = (level.rows - 3) * T;
  const rush = speedFor(b.health, cfg);

  if (b.y + b.h >= floorY && b.vy >= 0) {
    b.y = floorY - b.h;
    b.vy = 0;
    b.vx = 0;

    if (!b.nextLeapAt) b.nextLeapAt = now + 400;

    // Squish down as a warning, THEN leap. This is the fair-warning window.
    if (!isWindingUp(b, now) && now >= b.nextLeapAt && !b.windupDone) {
      b.windupUntil = now + cfg.BOSS_WINDUP_MS / rush;
      b.windupDone = true;
    }
    if (b.windupDone && !isWindingUp(b, now)) {
      const toward = Math.sign(player.x - b.x) || 1;
      b.vx = toward * 190 * rush;
      b.vy = -820 * rush;
      b.windupDone = false;
      b.nextLeapAt = 0;
    }
  } else {
    b.vy = Math.min(b.vy + cfg.GRAVITY * 0.8 * dt, cfg.MAX_FALL_SPEED);
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // keep him inside the arena
  const minX = T;
  const maxX = (level.cols - 1) * T - b.w;
  if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx); }
  if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }

  return b;
}

// Returns what happened this frame: 'hit' (you hurt him), 'hurt' (he got you),
// or null.
export function bossCollision(boss, player, fallingVy, now, cfg = CONFIG) {
  if (boss.defeated) return null;
  const pb = playerBox(player);

  if (fallingVy > 0 && overlaps(pb, bossHeadBox(boss, cfg))) return 'hit';
  if (now > boss.hurtUntil && overlaps(pb, bossBox(boss))) return 'hurt';
  return null;
}

export function damageBoss(boss, now, cfg = CONFIG) {
  const b = { ...boss, health: boss.health - 1, hurtUntil: now + 600 };
  if (b.health <= 0) { b.health = 0; b.defeated = true; b.vx = 0; b.vy = 0; }
  return b;
}
