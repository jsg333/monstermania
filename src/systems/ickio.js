// Ickio — the star of Ethan's game.
//
// A vibrant lime-green monster with a hole you can see and jump into. Ickios
// come in matching pairs: dive into one, shoot out of the other.
//
// THE RULE THAT MATTERS MOST:
//   Ickio does not slow you down. He burps you out just as fast as you went
//   in. Fall a long way in, come rocketing out. That single rule is what
//   gives this game a skill ceiling, and it must never be "tidied up".
//
// You enter by touching the hole. No button — Monstermania is a one-button
// game and that button is jump.

import CONFIG from '../data/config.js';
import { overlaps, playerBox } from './hazards.js';
import { teleportThroughIckio } from './physics.js';

export function holeBox(ick, cfg = CONFIG) {
  const T = cfg.TILE;
  const r = cfg.ICKIO_HOLE;
  return { x: ick.x + (T - r) / 2, y: ick.y + (T - r) / 2, w: r, h: r };
}

export function exitBox(exit, cfg = CONFIG) {
  const T = cfg.TILE;
  return { x: exit.x - T * 0.25, y: exit.y - T * 0.5, w: T * 1.5, h: T * 1.5 };
}

// Which hole are we falling into right now? Skips the one we just came out
// of, otherwise you'd ping-pong between the pair forever.
export function enteredIckio(player, level, cfg = CONFIG) {
  const pb = playerBox(player);
  for (const ick of level.ickios) {
    if (ick.id === player.ickioIgnore) continue;
    if (overlaps(pb, holeBox(ick, cfg))) return ick;
  }
  return null;
}

export function applyIckio(player, level, cfg = CONFIG) {
  let p = player;

  // Once you're clear of the hole you came out of, it's live again.
  if (p.ickioIgnore != null) {
    const src = level.ickios.find((i) => i.id === p.ickioIgnore);
    if (!src || !overlaps(playerBox(p), holeBox(src, cfg))) p = { ...p, ickioIgnore: null };
  }

  const from = enteredIckio(p, level, cfg);
  if (!from) return { player: p, used: null };

  const to = level.ickios.find((i) => i.id === from.link);
  if (!to) return { player: p, used: null };

  // Speed in === speed out. Do not "fix" this.
  p = teleportThroughIckio(p, holeBox(from, cfg), holeBox(to, cfg));
  return { player: { ...p, ickioIgnore: to.id, onGround: false, jumping: false }, used: { from, to } };
}

export function reachedExit(player, level, cfg = CONFIG) {
  if (!level.exit) return false;
  return overlaps(playerBox(player), exitBox(level.exit, cfg));
}
