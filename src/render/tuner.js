// The Tuning Panel — Ethan's dial box.
//
// Open the game with ?tune on the end of the address to switch it on:
//   https://monstermania.pages.dev/?tune
//
// Drag a slider and the game changes WHILE you are playing it. Nothing is
// saved until you press "Copy these numbers" and paste them into
// src/data/config.js — so you can never break anything by experimenting.

import CONFIG from '../data/config.js';

const SLIDERS = [
  { key: 'GRAVITY',     label: 'Gravity',      min: 800,  max: 7000, step: 50,
    hint: 'How hard the world pulls you down. Lower = floaty like the moon.' },
  { key: 'JUMP_SPEED',  label: 'Jump power',   min: 300,  max: 1600, step: 10,
    hint: 'How hard you launch. Higher = bigger jump.' },
  { key: 'RUN_SPEED',   label: 'Run speed',    min: 100,  max: 600,  step: 10,
    hint: 'Your top running speed.' },
  { key: 'JUMP_CUTOFF', label: 'Tap vs hold',  min: 0.1,  max: 1,    step: 0.02,
    hint: 'How small a quick tap is. At 1.0 tapping and holding are the same.' }
];

// "Now" is captured from config.js at load, so it always means "what the game
// really ships with" and can never go stale.
const SHIPPED = { GRAVITY: CONFIG.GRAVITY, JUMP_SPEED: CONFIG.JUMP_SPEED,
                  RUN_SPEED: CONFIG.RUN_SPEED, JUMP_CUTOFF: CONFIG.JUMP_CUTOFF };

const PRESETS = {
  'Floaty':  { GRAVITY: 1400, JUMP_SPEED: 620, RUN_SPEED: 250, JUMP_CUTOFF: 0.40 },
  'Softer':  { GRAVITY: 2600, JUMP_SPEED: 780, RUN_SPEED: 300, JUMP_CUTOFF: 0.30 },
  'Now':     SHIPPED,
  'Faster':  { GRAVITY: 5200, JUMP_SPEED: 1080, RUN_SPEED: 340, JUMP_CUTOFF: 0.1 }
};

// What the numbers actually MEAN, in things you can see on screen.
function describe(cfg) {
  const heightPx = (cfg.JUMP_SPEED ** 2) / (2 * cfg.GRAVITY);
  const airtimeS = (2 * cfg.JUMP_SPEED) / cfg.GRAVITY;
  return {
    blocks: (heightPx / cfg.TILE).toFixed(1),
    airtime: airtimeS.toFixed(2)
  };
}

export function createTuner() {
  if (!new URLSearchParams(location.search).has('tune')) return;

  const el = document.createElement('div');
  el.id = 'tune';
  el.innerHTML = `
    <style>
      #tune { position: fixed; top: 12px; right: 12px; width: 260px; z-index: 10;
        background: #14301f; border: 2px solid #4ea86a; border-radius: 10px;
        padding: 12px 14px; color: #dff5e4; font: 13px system-ui, sans-serif; }
      #tune h2 { margin: 0 0 2px; font-size: 15px; color: #9cff6b; }
      #tune .sub { margin: 0 0 10px; font-size: 11px; opacity: .75; }
      #tune label { display: block; margin-top: 10px; font-weight: 600; }
      #tune .val { float: right; font-weight: 400; color: #9cff6b; }
      #tune input[type=range] { width: 100%; margin: 3px 0 0; accent-color: #4ea86a; }
      #tune .hint { font-size: 10.5px; opacity: .65; line-height: 1.3; }
      #tune .row { display: flex; gap: 5px; margin: 12px 0 4px; flex-wrap: wrap; }
      #tune button { flex: 1; min-width: 58px; cursor: pointer; border-radius: 6px;
        border: 1px solid #4ea86a; background: #1d4630; color: #dff5e4;
        font: 600 11px system-ui; padding: 5px 2px; }
      #tune button:hover { background: #2a6344; }
      #tune .copy { width: 100%; margin-top: 8px; background: #4ea86a; color: #10241a; border-color: #7fd89b; }
      #tune .facts { margin-top: 10px; padding-top: 8px; border-top: 1px solid #2f6b45;
        font-size: 11.5px; line-height: 1.5; }
    </style>
    <h2>Tuning Panel</h2>
    <p class="sub">Drag while you play. Nothing saves until you copy.</p>
    <div class="row" id="tune-presets"></div>
    <div id="tune-sliders"></div>
    <div class="facts" id="tune-facts"></div>
    <button class="copy" id="tune-copy">Copy these numbers</button>
  `;
  document.body.appendChild(el);

  // The whole game jumps on any click, so the panel must eat its own clicks.
  for (const ev of ['mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'keyup']) {
    el.addEventListener(ev, (e) => e.stopPropagation());
  }

  const facts = el.querySelector('#tune-facts');
  const refreshFacts = () => {
    const d = describe(CONFIG);
    facts.innerHTML = `Jump height: <b>${d.blocks} blocks</b><br>Time in the air: <b>${d.airtime}s</b>`;
  };

  const inputs = {};
  const sliderBox = el.querySelector('#tune-sliders');
  for (const s of SLIDERS) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <label>${s.label}<span class="val" id="v-${s.key}">${CONFIG[s.key]}</span></label>
      <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${CONFIG[s.key]}">
      <div class="hint">${s.hint}</div>`;
    const input = wrap.querySelector('input');
    input.addEventListener('input', () => {
      CONFIG[s.key] = parseFloat(input.value);          // live — takes effect next frame
      el.querySelector('#v-' + s.key).textContent = input.value;
      refreshFacts();
    });
    inputs[s.key] = input;
    sliderBox.appendChild(wrap);
  }

  const presetBox = el.querySelector('#tune-presets');
  for (const [name, values] of Object.entries(PRESETS)) {
    const b = document.createElement('button');
    b.textContent = name;
    b.addEventListener('click', () => {
      for (const [k, v] of Object.entries(values)) {
        CONFIG[k] = v;
        if (inputs[k]) inputs[k].value = v;
        const label = el.querySelector('#v-' + k);
        if (label) label.textContent = v;
      }
      refreshFacts();
    });
    presetBox.appendChild(b);
  }

  el.querySelector('#tune-copy').addEventListener('click', async (e) => {
    const text = SLIDERS.map((s) => `  ${s.key}: ${CONFIG[s.key]},`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      e.target.textContent = 'Copied! Paste into config.js';
      setTimeout(() => { e.target.textContent = 'Copy these numbers'; }, 2200);
    } catch {
      window.prompt('Copy these into src/data/config.js:', text.replace(/\n/g, ' '));
    }
  });

  refreshFacts();
}
