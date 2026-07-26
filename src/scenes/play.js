// Phase 2: platforms, a camera, Grumps, dying and checkpoints.

import CONFIG from '../data/config.js';
import { restart } from '../state.js';
import { horizontalStep, verticalStep, canJump } from '../systems/physics.js';
import { takeJump } from '../systems/input.js';
import { moveAndCollide } from '../systems/collision.js';
import { followCamera, easeCamera } from '../systems/camera.js';
import { isDeadly, updateSnoozers, respawn, makePuff, stepPuff, collectGoo } from '../systems/hazards.js';
import { applyBouncers, touchingSpikes } from '../systems/bouncers.js';
import { applyIckio, reachedExit } from '../systems/ickio.js';
import { drawLevel, drawGrump, drawSnoozer, drawPlayer, drawPuff, drawGogio, drawFungy, drawGooDrop, drawIckio, drawBigIckio } from '../render/sprites.js';
import { drawFps, drawHint } from '../render/ui.js';

export function update(state, input, dt, now) {
  state.puff = stepPuff(state.puff, dt);
  state.time = now;

  // Won? Freeze the world until they press a button to play again.
  if (state.won) {
    if (input.jump && now - state.won > 800) Object.assign(state, restart(state));
    return state;
  }

  // Dead: hold still for a beat, then pop back at the checkpoint.
  if (state.deadUntil) {
    if (now >= state.deadUntil) {
      state.player = respawn(state.player, state.checkpoint);
      state.deadUntil = 0;
    }
    return state;
  }

  let p = state.player;
  p = horizontalStep(p, input, dt, CONFIG);

  const jumpNow = takeJump(input, canJump(p, now, CONFIG), now, CONFIG);
  p = verticalStep(p, { jumpNow, holding: input.jump }, dt, CONFIG);

  const wasOnGround = p.onGround;
  const arrivingSpeed = p.vy;      // before the floor cancels it — see bouncers.js
  p = moveAndCollide(p, state.level, dt, CONFIG);
  if (wasOnGround && !p.onGround) p = { ...p, leftGroundAt: now };

  // Land on a monster and he throws you. Must come after collision, or the
  // floor would cancel the bounce on the same frame.
  const boing = applyBouncers(p, state.level, now, CONFIG, arrivingSpeed);
  p = boing.player;
  state.lastBounce = boing.bounced || state.lastBounce;

  // ⭐ Ickio. Speed in, speed out.
  const warp = applyIckio(p, state.level, CONFIG);
  p = warp.player;
  if (warp.used) state.warps++;

  state.player = p;

  const woke = updateSnoozers(p, state.level, state.checkpoint, CONFIG);
  state.checkpoint = woke.checkpoint;

  state.gooDrops += collectGoo(p, state.level, CONFIG);

  if (reachedExit(p, state.level, CONFIG)) {
    state.won = now;
    return state;
  }

  // Ethan's rule: land on top of a monster or his spikes get you. Bouncing
  // wins — if you landed cleanly this frame you are safe, even though your
  // box briefly overlaps his sides on the way past.
  const spiked = boing.bounced === null && touchingSpikes(p, state.level, CONFIG);

  if (spiked || isDeadly(p, state.level, CONFIG)) {
    state.puff = state.puff.concat(makePuff(p));
    state.deaths++;
    state.deadUntil = now + CONFIG.RESPAWN_DELAY_MS;
    // Park the player off-screen so nothing draws mid-death.
    state.player = { ...p, x: -9999, y: -9999, vx: 0, vy: 0 };
  }

  return state;
}

export function draw(ctx, state, fps) {
  const dpr = window.devicePixelRatio || 1;
  const view = { w: ctx.canvas.width / dpr, h: ctx.canvas.height / dpr };
  const { level } = state;

  // Camera follows whoever is alive; when you're dead it stays put.
  if (!state.deadUntil) {
    const target = followCamera(state.cam, state.player, view, level, CONFIG);
    state.cam = easeCamera(state.cam, target, 1 / 60, CONFIG);
  }

  ctx.fillStyle = '#10241a';
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.save();
  ctx.translate(-Math.round(state.cam.x), -Math.round(state.cam.y));

  drawLevel(ctx, level, state.cam, view, CONFIG);
  if (level.exit) drawBigIckio(ctx, level.exit, state.time, CONFIG);
  for (const ick of level.ickios) drawIckio(ctx, ick, state.time, CONFIG);
  for (const s of level.snoozers) drawSnoozer(ctx, s, state.time, CONFIG);
  for (const f of level.fungies) drawFungy(ctx, f, state.time, CONFIG);
  for (const g of level.gogios) drawGogio(ctx, g, state.time, CONFIG);
  for (const d of level.gooDrops) drawGooDrop(ctx, d, state.time, CONFIG);
  for (const g of level.grumps) drawGrump(ctx, g, state.time, CONFIG);
  if (!state.deadUntil) drawPlayer(ctx, state.player);
  drawPuff(ctx, state.puff);

  ctx.restore();

  drawFps(ctx, fps);
  drawHint(ctx, 'Arrows or A/D to move  ·  ANY other button to jump  ·  land on TOP of a monster — his sides have spikes!', view.h - 40);
  const totalGoo = level.gooDrops.length;
  drawHint(ctx, `Restarts: ${state.deaths}   ·   Goo Drops: ${state.gooDrops} / ${totalGoo}`, view.h - 20);

  if (state.won) drawWinScreen(ctx, state, view);
}

function drawWinScreen(ctx, state, view) {
  ctx.save();
  ctx.fillStyle = 'rgba(6, 22, 12, 0.86)';
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7dff2e';
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillText('LEVEL COMPLETE!', view.w / 2, view.h / 2 - 40);

  ctx.fillStyle = '#dfffcb';
  ctx.font = '18px system-ui, sans-serif';
  const total = state.level.gooDrops.length;
  ctx.fillText(`Goo Drops: ${state.gooDrops} / ${total}`, view.w / 2, view.h / 2 + 4);
  ctx.fillText(`Restarts: ${state.deaths}`, view.w / 2, view.h / 2 + 30);
  ctx.fillText(`Trips through Ickio: ${state.warps}`, view.w / 2, view.h / 2 + 56);

  ctx.fillStyle = '#9cff6b';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('Press any button to play again', view.w / 2, view.h / 2 + 100);
  ctx.textAlign = 'left';
  ctx.restore();
}
