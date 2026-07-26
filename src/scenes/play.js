// Phase 1: run and jump in a test room. No monsters, no hazards, no goal yet.
// The ONLY question this scene has to answer is "does the jump feel good?"

import CONFIG from '../data/config.js';
import { horizontalStep, verticalStep } from '../systems/physics.js';
import { moveAndCollide, isSolid } from '../systems/collision.js';
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
  const viewW = ctx.canvas.width / (window.devicePixelRatio || 1);
  const viewH = ctx.canvas.height / (window.devicePixelRatio || 1);
  const levelW = level.tiles[0].length * T;
  const levelH = level.tiles.length * T;

  ctx.fillStyle = '#10241a';
  ctx.fillRect(0, 0, viewW, viewH);

  // Phase 1 only: the whole room fits on screen, so just centre it.
  // Phase 2 replaces this with a camera that follows the player.
  const offX = Math.round((viewW - levelW) / 2);
  const offY = Math.round((viewH - levelH) / 2);
  ctx.save();
  ctx.translate(offX, offY);

  // Platforms — flat on top, just like Ethan said.
  for (let r = 0; r < level.tiles.length; r++) {
    for (let c = 0; c < level.tiles[r].length; c++) {
      if (level.tiles[r][c] !== 1) continue;
      ctx.fillStyle = '#2f6b45';
      ctx.fillRect(c * T, r * T, T, T);
      // Only highlight a surface you could actually stand on. Without this
      // check, a stack of wall tiles gets a stripe every 32px and reads as
      // a ladder instead of a wall.
      if (!isSolid(level, c, r - 1)) {
        ctx.fillStyle = '#4ea86a';
        ctx.fillRect(c * T, r * T, T, 5);
      }
    }
  }

  // Placeholder player. Phase 6 replaces this with the character you build.
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#1b1b1b';
  const eyeX = player.x + (player.facing > 0 ? 14 : 4);
  ctx.fillRect(eyeX, player.y + 8, 5, 6);

  ctx.restore();

  drawFps(ctx, fps);
  drawHint(ctx, 'Arrows or A/D to move  \u00b7  ANY other button to jump  \u00b7  hold longer = jump higher', viewH - 40);
  drawHint(ctx, `Restarts: ${state.deaths}`, viewH - 20);
}
