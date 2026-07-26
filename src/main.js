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

function frame(now) {
  // Clamp dt so alt-tabbing doesn't teleport the player through a wall.
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  fps += ((1 / Math.max(dt, 0.0001)) - fps) * 0.1;

  play.update(state, input, dt, now);
  play.draw(ctx, state, fps);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
