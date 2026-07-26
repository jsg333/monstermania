// Phase 1: run and jump in a test room. No monsters, no hazards, no goal yet.
// The ONLY question this scene has to answer is "does the jump feel good?"

import CONFIG from '../data/config.js';
import { horizontalStep, verticalStep } from '../systems/physics.js';
import { moveAndCollide } from '../systems/collision.js';
import { drawFps, drawHint } from '../render/ui.js';

export function update(state, input, dt, now) {
  let p = state.player;
  p = horizontalStep(p, input, dt, CONFIG);
  p = verticalStep(p, input, dt, now, CONFIG);

  const wasOnGround = p.onGround;
  p = moveAndCollide(p, state.level, dt, CONFIG);
  if (wasOnGround && !p.onGround) p = { ...p, leftGroundAt: now };

  // Fell out of the world? Straight back to the checkpoint. (Phase 2 makes this proper.)
  if (p.y > state.level.tiles.length * CONFIG.TILE + 200) {
    p = { ...p, x: state.checkpoint.x, y: state.checkpoint.y, vx: 0, vy: 0 };
    state.deaths++;
  }

  state.player = p;
  return state;
}

export function draw(ctx, state, fps) {
  const T = CONFIG.TILE;
  const { level, player } = state;

  ctx.fillStyle = '#10241a';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Platforms — flat on top, just like Ethan said.
  for (let r = 0; r < level.tiles.length; r++) {
    for (let c = 0; c < level.tiles[r].length; c++) {
      if (level.tiles[r][c] !== 1) continue;
      ctx.fillStyle = '#2f6b45';
      ctx.fillRect(c * T, r * T, T, T);
      ctx.fillStyle = '#4ea86a';
      ctx.fillRect(c * T, r * T, T, 5);
    }
  }

  // Placeholder player. Phase 6 replaces this with the character you build.
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#1b1b1b';
  const eyeX = player.x + (player.facing > 0 ? 14 : 4);
  ctx.fillRect(eyeX, player.y + 8, 5, 6);

  drawFps(ctx, fps);
  drawHint(ctx, 'Arrows or A/D to move  ·  ANY other button to jump  ·  hold longer = jump higher', ctx.canvas.height - 40);
  drawHint(ctx, `Restarts: ${state.deaths}`, ctx.canvas.height - 20);
}
