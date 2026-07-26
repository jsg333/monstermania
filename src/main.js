import { createState } from './state.js';
import { createInput } from './systems/input.js';
import { createTuner } from './render/tuner.js';
import { load, recordClear, save } from './systems/save.js';
import world1 from './data/levels/world1.js';
import playground from './data/levels/playground.js';
import * as play from './scenes/play.js';
import * as levelSelect from './scenes/levelSelect.js';
import * as monsterMaker from './scenes/monsterMaker.js';
import * as editor from './scenes/editor.js';
import { drawEditor } from './render/editorDraw.js';
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
const EDITOR_KEY = 'monstermania.mylevel.v1';
let ed = editor.createEditor(
  (() => { try { return JSON.parse(localStorage.getItem(EDITOR_KEY)); } catch { return null; } })()
);
const saveEditor = () => {
  try { localStorage.setItem(EDITOR_KEY, JSON.stringify(ed.grid)); } catch { /* ignore */ }
};

const maker = monsterMaker.createMaker(sel.save);
monsterMaker.attachTyping(maker, window);
monsterMaker.attachNameField(maker, document);
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
    if (scene === 'editor') {
      const hover = editor.cellAt(view, input.pointerX, input.pointerY);

      if (input.escape) {
        saveEditor();
        scene = 'select';
        sel.openedAt = now;
        input.escape = false;
        input.jump = false;
        input.jumpConsumed = true;
        input.pointerClick = false;
      } else if (input.pointerClick || input.pointerDown) {
        const px = input.pointerX, py = input.pointerY;
        let handled = false;

        if (input.pointerClick) {
          for (const r of editor.tabRects(view)) {
            if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
              ed.tab = r.i; ed.tool = 0; handled = true;
            }
          }
          for (const r of editor.toolRects(ed, view)) {
            if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
              ed.tool = r.i; handled = true;
            }
          }
          for (const r of editor.buttonRects(view)) {
            if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
              handled = true;
              if (r.id === 'clear') { ed = editor.createEditor(null); saveEditor(); }
              if (r.id === 'back') {
                saveEditor();
                scene = 'select';
                sel.openedAt = now;
                input.jump = false;
                input.jumpConsumed = true;
              }
              if (r.id === 'play') {
                const built = editor.tryBuild(ed, 'My Level');
                if (built && built.error) {
                  ed.message = built.error;
                } else {
                  saveEditor();
                  game = createState(built, sel.save.character);
                  game.fromEditor = true;
                  clearedHandled = true;          // custom levels don't unlock anything
                  scene = 'play';
                  input.jump = false;
                  input.jumpConsumed = true;
                }
              }
            }
          }
          input.pointerClick = false;
        }

        // painting on the grid — drag to draw
        if (!handled && hover && scene === 'editor') {
          if (editor.paint(ed, hover.col, hover.row, editor.currentTool(ed).ch)) {
            ed.dirty = true;
          }
        }
      }

      if (scene === 'editor') {
        if (ed.dirty) { ed.lastCheck = editor.validate(ed); ed.dirty = false; saveEditor(); }
        if (!ed.lastCheck) ed.lastCheck = editor.validate(ed);
        drawEditor(ctx, ed, view, hover);
      }
    } else if (scene === 'maker') {
      const done = monsterMaker.update(maker, input, now, view);
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
      const chosen = levelSelect.update(sel, input, now, view);
      levelSelect.draw(ctx, sel, view);
      if (sel.openEditor) {
        sel.openEditor = false;
        input.down = false;
        input.jump = false;
        input.jumpConsumed = true;
        scene = 'editor';
      } else if (sel.openMaker) {
        sel.openMaker = false;
        input.up = false;
        maker.goo = totalGoo(sel.save);
        maker.character = { ...(sel.save.character || maker.character) };
        scene = 'maker';
      } else if (chosen) {
        game = createState(chosen, sel.save.character);
        input.pointerClick = false;
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

        // Show the player where they're going next, right on the win screen.
        const at = levels.findIndex((l) => l.id === game.level.id);
        const next = at >= 0 ? levels[at + 1] : null;
        game.nextTitle = next ? `${next.id}  ${next.title}` : null;
      }

      if (game.advance && game.fromEditor) {
        scene = 'editor';              // finished your own level — back to building
        game.advance = false;
        input.jump = false;
        input.jumpConsumed = true;
      } else if (game.advance) {
        const at = levels.findIndex((l) => l.id === game.level.id);
        const next = at >= 0 ? levels[at + 1] : null;
        if (next) {
          sel.index = at + 1;                 // keep the menu in step
          game = createState(next, sel.save.character);
          clearedHandled = false;
        } else {
          scene = 'select';                   // finished the world
          sel.openedAt = now;
        }
        // Clear the held button, or it immediately fires again on the next
        // screen — which is what made a finished level look like it repeated.
        input.jump = false;
        input.jumpConsumed = true;
        input.pointerClick = false;
      }

      if (game.backToSelect) {
        scene = game.fromEditor ? 'editor' : 'select';
        sel.openedAt = now;
        game.backToSelect = false;
        input.jump = false;
        input.jumpConsumed = true;
        input.pointerClick = false;
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
  get editor() { return ed; },
  openEditor() { scene = 'editor'; },
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
