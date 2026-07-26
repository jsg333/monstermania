import { createState } from './state.js';
import { createInput } from './systems/input.js';
import * as play from './scenes/play.js';
import { createTuner } from './render/tuner.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = createState();
const input = createInput(window);
createTuner();

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
let fps = 60;

// If something throws inside the game loop, the loop stops and the screen
// freezes with no explanation — which just looks like "the game is broken".
// Show the problem instead of dying quietly.
function crashed(err) {
  console.error('Monstermania crashed:', err);
  const w = ctx.canvas.width / (window.devicePixelRatio || 1);
  ctx.fillStyle = '#2a0f14';
  ctx.fillRect(0, 0, w, 90);
  ctx.fillStyle = '#ff9a9a';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('Oops — the game hit a bug and stopped. Reload to try again.', 20, 34);
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(String(err && err.message ? err.message : err).slice(0, 140), 20, 58);
  ctx.fillText(String(err && err.stack ? err.stack.split('\n')[1] || '' : '').trim().slice(0, 140), 20, 76);
}

function frame(now) {
  // Clamp dt so alt-tabbing doesn't teleport the player through a wall.
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  fps += ((1 / Math.max(dt, 0.0001)) - fps) * 0.1;

  try {
    play.update(state, input, dt, now);
    play.draw(ctx, state, fps);
  } catch (err) {
    crashed(err);
    return;                       // stop the loop, but leave the message up
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
