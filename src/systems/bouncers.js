// Fungy and Gogio — the first two monsters that are your MOVES.
//
// The whole point of Monstermania: you can only run and jump. Everything
// else you can do comes from a monster standing in the level.
//
//   Fungy  — a small hop, thrown the way you are already running.
//            Never gets tired. Use him a hundred times in a row.
//   Gogio  — a huge bounce, straight up. Gets flatter every time you land
//            on him, and needs a breather to puff back up.
//
// They are deliberately NOT "a good one and a worse one". Fungy is for
// crossing. Gogio is for climbing.

import CONFIG from '../data/config.js';
import { overlaps, playerBox } from './hazards.js';

// You only bounce by landing on TOP of a monster while falling. Walking into
// one from the side does nothing — otherwise you'd get flung around by
// accident every time you brushed past.
export function landingBox(m, cfg = CONFIG) {
  return { x: m.x + 2, y: m.y, w: cfg.TILE - 4, h: cfg.TILE * 0.55 };
}

// `fallingVy` is how fast you were falling when you ARRIVED, before the floor
// had its say. That distinction matters: a monster standing on the ground is
// the same height as you are when you land next to him, so the floor zeroes
// your speed on the very same frame you touch him. Checking the post-collision
// speed meant every monster standing on solid ground was impossible to bounce
// on — which is most of them.
export function isLandingOn(player, m, cfg = CONFIG, fallingVy = player.vy) {
  if (fallingVy <= 0) return false;                     // must have been falling
  return overlaps(playerBox(player), landingBox(m, cfg));
}

// --- Gogio's tiring state machine -------------------------------------
// Leave him alone long enough and he puffs back up to full power.

export function gogioRested(g, now, cfg = CONFIG) {
  return now - (g.lastBounceAt ?? -Infinity) > cfg.GOGIO_RECOVER_MS;
}

export function gogioPower(g, now, cfg = CONFIG) {
  const squashes = gogioRested(g, now, cfg) ? 0 : (g.bounces ?? 0);
  return cfg.GOGIO_BOUNCE_SPEED * Math.pow(cfg.GOGIO_TIRED_STEP, squashes);
}

export function bounceGogio(g, now, cfg = CONFIG) {
  const wasRested = gogioRested(g, now, cfg);
  const squashes = wasRested ? 0 : (g.bounces ?? 0);
  const power = cfg.GOGIO_BOUNCE_SPEED * Math.pow(cfg.GOGIO_TIRED_STEP, squashes);

  g.bounces = Math.min(squashes + 1, cfg.GOGIO_MAX_BOUNCES);
  g.lastBounceAt = now;
  g.squash = 1;                    // for the squash-and-stretch drawing
  return power;
}

// --- Fungy -------------------------------------------------------------
// Always the same hop, and he throws you the way you're already going.

export function bounceFungy(f, player, now, cfg = CONFIG) {
  f.lastBounceAt = now;
  f.squash = 1;
  const dir = player.vx !== 0 ? Math.sign(player.vx) : player.facing;
  return { vy: -cfg.FUNGY_HOP_SPEED, vx: player.vx + dir * cfg.FUNGY_FORWARD_BOOST };
}

// --- Put it together ---------------------------------------------------

export function applyBouncers(player, level, now, cfg = CONFIG, fallingVy = player.vy) {
  let p = player;
  let bounced = null;

  for (const g of level.gogios) {
    if (!isLandingOn(p, g, cfg, fallingVy)) continue;
    const power = bounceGogio(g, now, cfg);
    p = { ...p, y: g.y - p.h, vy: -power, onGround: false, jumping: false };
    bounced = 'gogio';
  }

  for (const f of level.fungies) {
    if (!isLandingOn(p, f, cfg, fallingVy)) continue;
    const hop = bounceFungy(f, p, now, cfg);
    const capped = Math.max(-cfg.RUN_SPEED * 2, Math.min(cfg.RUN_SPEED * 2, hop.vx));
    p = { ...p, y: f.y - p.h, vy: hop.vy, vx: capped, onGround: false, jumping: false };
    bounced = 'fungy';
  }

  return { player: p, bounced };
}

// How squashed to draw a monster right now: 1 = fully squashed, 0 = normal.
export function squashAmount(m, now, cfg = CONFIG) {
  const since = now - (m.lastBounceAt ?? -Infinity);
  if (!isFinite(since) || since > cfg.SQUASH_MS) return 0;
  return 1 - since / cfg.SQUASH_MS;
}

// How tired Gogio looks: 0 = full and round, 1 = completely flat.
export function tiredAmount(g, now, cfg = CONFIG) {
  if (gogioRested(g, now, cfg)) return 0;
  return (g.bounces ?? 0) / cfg.GOGIO_MAX_BOUNCES;
}
