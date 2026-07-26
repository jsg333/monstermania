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
import { stepBoss, bossCollision, damageBoss, bossBox, isWindingUp } from '../systems/boss.js';
import { drawLevel, drawGrump, drawSnoozer, drawPlayer, drawPuff, drawGogio, drawFungy, drawGooDrop, drawIckio, drawBigIckio } from '../render/sprites.js';
import { drawFps, drawHint } from '../render/ui.js';
import { sfx } from '../systems/sound.js';
import { themeFor } from '../data/themes.js';

export function update(state, input, dt, now) {
  state.puff = stepPuff(state.puff, dt);
  state.time = now;

  // Never trap a player in a level they can't finish.
  if (input.escape) {
    state.backToSelect = true;
    return state;
  }

  // Won? Freeze the world until they press a button to play again.
  if (state.won) {
    if (input.jump && now - state.won > 800) {
      const fresh = restart(state);
      Object.assign(state, fresh, { backToSelect: true });
    }
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
  if (jumpNow) sfx.jump();
  p = verticalStep(p, { jumpNow, holding: input.jump }, dt, CONFIG);

  const wasOnGround = p.onGround;
  const arrivingSpeed = p.vy;      // before the floor cancels it — see bouncers.js
  p = moveAndCollide(p, state.level, dt, CONFIG);
  if (wasOnGround && !p.onGround) p = { ...p, leftGroundAt: now };

  // Land on a monster and he throws you. Must come after collision, or the
  // floor would cancel the bounce on the same frame.
  const boing = applyBouncers(p, state.level, now, CONFIG, arrivingSpeed);
  p = boing.player;
  if (boing.bounced === 'gogio') sfx.gogio();
  if (boing.bounced === 'fungy') sfx.fungy();
  state.lastBounce = boing.bounced || state.lastBounce;

  // --- Big Gogio ---
  if (state.boss) {
    state.boss = stepBoss(state.boss, p, state.level, dt, now, CONFIG);
    const what = bossCollision(state.boss, p, arrivingSpeed, now, CONFIG);
    if (what === 'hit') {
      state.boss = damageBoss(state.boss, now, CONFIG);
      sfx.hit();
      p = { ...p, y: state.boss.y - p.h, vy: -CONFIG.BOSS_BOUNCE_BACK, onGround: false, jumping: false };
      state.puff = state.puff.concat(makePuff({ ...p, y: state.boss.y }, 10));
      if (state.boss.defeated) { state.player = p; state.won = now; sfx.win(); return state; }
    } else if (what === 'hurt') {
      sfx.death();
      state.puff = state.puff.concat(makePuff(p));
      state.deaths++;
      state.deadUntil = now + CONFIG.RESPAWN_DELAY_MS;
      state.player = { ...p, x: -9999, y: -9999, vx: 0, vy: 0 };
      return state;
    }
  }

  // ⭐ Ickio. Speed in, speed out.
  const warp = applyIckio(p, state.level, CONFIG);
  p = warp.player;
  if (warp.used) { state.warps++; sfx.warp(); }

  state.player = p;

  const woke = updateSnoozers(p, state.level, state.checkpoint, CONFIG);
  state.checkpoint = woke.checkpoint;

  const picked = collectGoo(p, state.level, CONFIG);
  if (picked) { state.gooDrops += picked; sfx.coin(); }

  if (reachedExit(p, state.level, CONFIG)) {
    state.won = now;
    sfx.win();
    return state;
  }

  // Ethan's rule: land on top of a monster or his spikes get you. Bouncing
  // wins — if you landed cleanly this frame you are safe, even though your
  // box briefly overlaps his sides on the way past.
  const spiked = boing.bounced === null && touchingSpikes(p, state.level, CONFIG);

  if (spiked || isDeadly(p, state.level, CONFIG)) {
    sfx.death();
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

  ctx.fillStyle = themeFor(level).sky;
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
  if (state.boss) drawBoss(ctx, state.boss, state.time);
  if (!state.deadUntil) drawPlayer(ctx, state.player, state.character);
  drawPuff(ctx, state.puff);

  ctx.restore();

  drawFps(ctx, fps);
  drawHint(ctx, 'Arrows or A/D to move  ·  ANY other button to jump  ·  land on TOP of a monster — his sides have spikes!  ·  ESC = menu', view.h - 40);
  const totalGoo = level.gooDrops.length;
  drawHint(ctx, `Restarts: ${state.deaths}   ·   Goo Drops: ${state.gooDrops} / ${totalGoo}`, view.h - 20);

  if (state.boss) drawBossHealth(ctx, state.boss, view);
  if (state.won) drawWinScreen(ctx, state, view);
}

// Big Gogio — same monster, four times the size, twice the attitude.
function drawBoss(ctx, b, time) {
  const winding = isWindingUp(b, time);
  const squash = winding ? 0.34 : 0;
  const h = b.h * (1 - squash);
  const w = b.w * (1 + squash * 0.5);
  const cx = b.x + b.w / 2;
  const bottom = b.y + b.h;
  const cy = bottom - h / 2;

  ctx.fillStyle = '#0d3f63';
  for (let i = 0; i <= 9; i++) {
    const a = Math.PI * (0.04 + (i / 9) * 0.92);
    const px = cx + Math.cos(a) * (w / 2);
    const py = cy + Math.sin(a) * (h / 2);
    ctx.beginPath();
    ctx.moveTo(px - Math.sin(a) * 5, py + Math.cos(a) * 5);
    ctx.lineTo(px + Math.cos(a) * 12, py + Math.sin(a) * 12);
    ctx.lineTo(px + Math.sin(a) * 5, py - Math.cos(a) * 5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = b.defeated ? '#6f8fa5' : (winding ? '#1c6ea3' : '#2f9de0');
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  const eyeY = bottom - h * 0.66;
  ctx.strokeStyle = '#05243a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 20, eyeY - 10); ctx.lineTo(cx - 6, eyeY - 2);
  ctx.moveTo(cx + 20, eyeY - 10); ctx.lineTo(cx + 6, eyeY - 2);
  ctx.stroke();

  ctx.fillStyle = b.defeated ? '#cfe6f5' : '#fff6a8';
  ctx.beginPath(); ctx.arc(cx - 12, eyeY + 3, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 12, eyeY + 3, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#05243a';
  ctx.beginPath(); ctx.arc(cx - 11, eyeY + 3, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 13, eyeY + 3, 2.6, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#05243a';
  ctx.beginPath();
  const my = bottom - h * 0.32;
  ctx.moveTo(cx - 18, my);
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(cx - 18 + (i + 0.5) * 6, my + 7);
    ctx.lineTo(cx - 18 + (i + 1) * 6, my);
  }
  ctx.closePath();
  ctx.fill();

  if (winding) {
    ctx.fillStyle = '#ffe066';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', cx, b.y - 8);
    ctx.textAlign = 'left';
  }
}

function drawBossHealth(ctx, b, view) {
  const w = 260, h = 16;
  const x = view.w / 2 - w / 2;
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.fillRect(x - 3, 21, w + 6, h + 6);
  ctx.fillStyle = '#3a1520';
  ctx.fillRect(x, 24, w, h);
  ctx.fillStyle = '#ff5470';
  ctx.fillRect(x, 24, w * (b.health / CONFIG.BOSS_HEALTH), h);
  ctx.fillStyle = '#ffd9e0';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BIG GOGIO', view.w / 2, 36);
  ctx.textAlign = 'left';
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
  ctx.fillText('Press any button to keep going', view.w / 2, view.h / 2 + 100);
  ctx.textAlign = 'left';
  ctx.restore();
}
