// Phase 2: platforms, a camera, Grumps, dying and checkpoints.

import CONFIG from '../data/config.js';
import { horizontalStep, verticalStep, canJump } from '../systems/physics.js';
import { takeJump } from '../systems/input.js';
import { moveAndCollide } from '../systems/collision.js';
import { followCamera, easeCamera } from '../systems/camera.js';
import { isDeadly, updateSnoozers, respawn, makePuff, stepPuff, collectGoo } from '../systems/hazards.js';
import { applyBouncers, touchingSpikes } from '../systems/bouncers.js';
import { drawLevel, drawGrump, drawSnoozer, drawPlayer, drawPuff, drawGogio, drawFungy, drawGooDrop } from '../render/sprites.js';
import { drawFps, drawHint } from '../render/ui.js';

export function update(state, input, dt, now) {
  state.puff = stepPuff(state.puff, dt);
  state.time = now;

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

  state.player = p;

  const woke = updateSnoozers(p, state.level, state.checkpoint, CONFIG);
  state.checkpoint = woke.checkpoint;

  state.gooDrops += collectGoo(p, state.level, CONFIG);

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
}
