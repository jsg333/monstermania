import { createState } from './state.js';
import { createInput } from './systems/input.js';
import { createTuner } from './render/tuner.js';
import { load, recordClear, save } from './systems/save.js';
import world1 from './data/levels/world1.js';
import playground from './data/levels/playground.js';
import * as play from './scenes/play.js';
import * as levelSelect from './scenes/levelSelect.js';
import * as monsterMaker from './scenes/monsterMaker.js';
import { totalGoo } from './systems/save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(window);
createTuner();

const params = new URLSearchParams(location.search);
const levels = params.has('playground') ? [playground] : world1;

let scene = 'select';
let game = null;
const sel = {
  levels,
  index: 0,
  lastMove: 0,
  openedAt: performance.now(),
  save: load()
};

// Skip straight into a level with ?level=1-3, handy for testing.
// First time here? Build your monster before you play.
const maker = monsterMaker.createMaker(sel.save);
monsterMaker.attachTyping(maker, window);
if (!sel.save.character) scene = 'maker';

const jumpTo = params.get('level');
if (jumpTo || params.has('playground')) {
  const found = levels.find((l) => l.id === jumpTo) || levels[0];
  game = createState(found);
  scene = 'play';
}

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
let clearedHandled = false;

// A silent freeze just looks like "the game is broken". Show the problem.
let lastError = null;
function crashed(err) {
  lastError = err;
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

// One frame of work, separated from requestAnimationFrame so tests can drive
// it directly. Browsers throttle rAF to nothing in a background tab, which
// makes a perfectly healthy game look frozen — that cost me a lot of time.
function tick(now, dt) {
  fps += ((1 / Math.max(dt, 0.0001)) - fps) * 0.1;

  const dpr = window.devicePixelRatio || 1;
  const view = { w: ctx.canvas.width / dpr, h: ctx.canvas.height / dpr };

  try {
    if (scene === 'maker') {
      const done = monsterMaker.update(maker, input, now);
      monsterMaker.draw(ctx, maker, view);
      if (done) {
        sel.save = save({ ...sel.save, character: { ...done } });
        maker.goo = totalGoo(sel.save);
        scene = 'select';
        sel.openedAt = now;
        // Enter counts as a jump too, and typing a name pressed a lot of
        // "jump" keys. Without clearing them, holding Enter would shoot you
        // straight past the level select and into level 1-1.
        input.confirm = false;
        input.jump = false;
        input.jumpConsumed = true;
        input.up = input.down = input.left = input.right = false;
      }
    } else if (scene === 'select') {
      const chosen = levelSelect.update(sel, input, now);
      levelSelect.draw(ctx, sel, view);
      if (sel.openMaker) {
        sel.openMaker = false;
        input.up = false;
        maker.goo = totalGoo(sel.save);
        maker.character = { ...(sel.save.character || maker.character) };
        scene = 'maker';
      } else if (chosen) {
        game = createState(chosen, sel.save.character);
        clearedHandled = false;
        scene = 'play';
        input.jump = false;
        input.jumpConsumed = true;
      }
    } else {
      play.update(game, input, dt, now);
      play.draw(ctx, game, fps);

      if (game.won && !clearedHandled) {
        clearedHandled = true;
        sel.save = recordClear(sel.save, game.level.id || 'playground', game.gooDrops);
      }
      if (game.backToSelect) {
        scene = 'select';
        sel.openedAt = now;
        game.backToSelect = false;
      }
    }
  } catch (err) {
    crashed(err);
    return false;
  }
  return true;
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  if (tick(now, dt)) requestAnimationFrame(frame);
}
try { requestAnimationFrame(frame); } catch (err) { crashed(err); }

// Testing hook. Lets a browser test read exact game state instead of trying
// to guess it from pixel colours — which is unreliable and, when the reads
// are expensive, actively slows the game down and produces false results.
window.__mm = {
  build: typeof __BUILD__ === 'string' ? __BUILD__ : 'dev',
  get lastError() { return lastError && (lastError.stack || String(lastError)); },
  get scene() { return scene; },
  get game() { return game; },
  get sel() { return sel; },
  get fps() { return fps; },
  get maker() { return maker; },
  goTo(id) {
    const found = levels.find((l) => l.id === id);
    if (!found) return false;
    game = createState(found, sel.save.character);
    clearedHandled = false;
    scene = 'play';
    return true;
  },
  place(x, y) { if (game) game.player = { ...game.player, x, y, vx: 0, vy: 0 }; },
  press(code) { window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); },
  release(code) { window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); },

  // Drive the game by hand — works even when the tab is hidden and rAF is
  // throttled to zero.
  setInput(patch) { Object.assign(input, patch); },
  step(frames = 1, dtMs = 16.7) {
    let t = last;
    for (let i = 0; i < frames; i++) {
      t += dtMs;
      last = t;
      if (!tick(t, dtMs / 1000)) return { crashed: true, at: i };
    }
    return { crashed: false, frames };
  }
};
