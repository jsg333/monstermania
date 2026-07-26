// Pure functions. No canvas, no DOM, no globals — that's what makes them testable.
// Given a player and what the buttons are doing, return the new player.

import CONFIG from '../data/config.js';

export function createPlayer(x = 0, y = 0) {
  return {
    x, y,
    vx: 0, vy: 0,
    w: 24, h: 32,
    onGround: false,
    facing: 1,
    jumping: false,        // true while rising from a jump we can still cut short
    leftGroundAt: -Infinity,
    alive: true
  };
}

// Ethan's ruling: COYOTE_TIME_MS is 0, so this is just "are you on the ground".
// The code stays general so we can playtest the other way without a rewrite.
export function canJump(player, now, cfg = CONFIG) {
  if (player.onGround) return true;
  return now - player.leftGroundAt <= cfg.COYOTE_TIME_MS;
}

export function horizontalStep(player, input, dt, cfg = CONFIG) {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const accel = player.onGround ? cfg.GROUND_ACCEL : cfg.AIR_ACCEL;
  const friction = player.onGround ? cfg.GROUND_FRICTION : cfg.AIR_FRICTION;
  let vx = player.vx;

  if (dir !== 0) {
    vx += dir * accel * dt;
    vx = Math.max(-cfg.RUN_SPEED, Math.min(cfg.RUN_SPEED, vx));
  } else if (vx !== 0) {
    const drop = friction * dt;
    vx = Math.abs(vx) <= drop ? 0 : vx - Math.sign(vx) * drop;
  }

  return { ...player, vx, facing: dir !== 0 ? dir : player.facing };
}

// `jumpNow` is a single-shot "start a jump this frame" flag from takeJump().
// `holding` is whether the button is still down (that's what makes a long
// press jump higher than a tap).
export function verticalStep(player, { jumpNow, holding }, dt, cfg = CONFIG) {
  let { vy, jumping } = player;

  if (jumpNow) {
    vy = -cfg.JUMP_SPEED;
    jumping = true;
  }

  // Hold longer = jump higher. Let go while rising and the jump gets cut short.
  if (jumping && !holding && vy < 0) {
    vy *= cfg.JUMP_CUTOFF;
    jumping = false;
  }
  if (vy >= 0) jumping = false;

  vy = Math.min(vy + cfg.GRAVITY * dt, cfg.MAX_FALL_SPEED);
  return { ...player, vy, jumping };
}

// ⭐ The most important function in the game.
// Ickio does NOT slow you down — he burps you out just as fast as you went in.
export function teleportThroughIckio(player, fromHole, toHole) {
  return {
    ...player,
    x: toHole.x + (player.x - fromHole.x),
    y: toHole.y + (player.y - fromHole.y),
    vx: player.vx,   // speed in === speed out. Never "fix" this.
    vy: player.vy
  };
}

export function speed(player) {
  return Math.hypot(player.vx, player.vy);
}
