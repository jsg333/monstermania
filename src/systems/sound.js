// Tiny synth sound effects — no audio files, no downloads, nothing to load.
//
// Browsers refuse to make noise until the player has interacted with the page,
// so the audio context is created lazily on the first sound and stays silent
// if the browser says no. Sound must never break the game.

let ctx = null;
let enabled = true;

function audio() {
  if (!enabled) return null;
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { enabled = false; return null; }
    ctx = new AC();
  } catch {
    enabled = false;
  }
  return ctx;
}

function blip({ from, to, ms, type = 'square', gain = 0.06 }) {
  const a = audio();
  if (!a) return;
  try {
    if (a.state === 'suspended') a.resume();
    const osc = a.createOscillator();
    const vol = a.createGain();
    const t = a.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + ms / 1000);
    vol.gain.setValueAtTime(gain, t);
    vol.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(vol).connect(a.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  } catch { /* never let a sound break the game */ }
}

export const sfx = {
  jump:   () => blip({ from: 380, to: 620, ms: 90, type: 'square', gain: 0.035 }),
  fungy:  () => blip({ from: 300, to: 900, ms: 140, type: 'triangle' }),
  gogio:  () => blip({ from: 200, to: 1200, ms: 260, type: 'square' }),
  coin:   () => { blip({ from: 980, to: 980, ms: 70, type: 'sine', gain: 0.07 });
                  setTimeout(() => blip({ from: 1470, to: 1470, ms: 110, type: 'sine', gain: 0.07 }), 70); },
  warp:   () => blip({ from: 900, to: 180, ms: 220, type: 'sine' }),
  death:  () => blip({ from: 420, to: 60, ms: 380, type: 'sawtooth', gain: 0.05 }),
  hit:    () => blip({ from: 160, to: 90, ms: 200, type: 'sawtooth', gain: 0.07 }),
  win:    () => { [523, 659, 784, 1047].forEach((f, i) =>
                    setTimeout(() => blip({ from: f, to: f, ms: 160, type: 'triangle', gain: 0.06 }), i * 110)); }
};

export function setSoundEnabled(on) {
  enabled = on;
  if (!on && ctx) { try { ctx.close(); } catch {} ctx = null; }
}

export function isSoundEnabled() {
  return enabled;
}
