// A camera that follows the player, with a dead zone in the middle so small
// hops don't make the whole world wobble. Pure function: state in, state out.

import CONFIG from '../data/config.js';

export function createCamera() {
  return { x: 0, y: 0 };
}

const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));

export function followCamera(cam, player, view, level, cfg = CONFIG) {
  const targetX = player.x + player.w / 2 - view.w / 2;
  const targetY = player.y + player.h / 2 - view.h / 2;

  // Dead zone: only move once the player drifts past this much from centre.
  const dz = cfg.CAMERA_DEADZONE;
  let x = cam.x;
  let y = cam.y;
  if (Math.abs(targetX - x) > dz) x += (targetX - x) - Math.sign(targetX - x) * dz;
  if (Math.abs(targetY - y) > dz) y += (targetY - y) - Math.sign(targetY - y) * dz;

  // Never show the empty space outside the level.
  return {
    x: clamp(x, 0, level.widthPx - view.w),
    y: clamp(y, 0, level.heightPx - view.h)
  };
}

// Smooth it out so the camera glides instead of snapping.
export function easeCamera(cam, target, dt, cfg = CONFIG) {
  const t = 1 - Math.pow(1 - cfg.CAMERA_EASE, dt * 60);
  return { x: cam.x + (target.x - cam.x) * t, y: cam.y + (target.y - cam.y) * t };
}
