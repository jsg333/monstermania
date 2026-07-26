// THE MONSTER MAKER — Ethan's ruling: the player names their own character
// and builds their own look. Parts unlock with Goo Drops, so every coin you
// find makes YOUR guy cooler.
//
// Controls stay simple: ← → pick a part, ↑ ↓ move between rows, type to name
// yourself, Enter to play.

import { SLOTS, isPartUnlocked, nextUnlock, defaultCharacter } from '../data/parts.js';
import { totalGoo } from '../systems/save.js';
import { drawCharacter } from '../render/sprites.js';
import { drawButton, hit } from '../render/uiButtons.js';

export function createMaker(saveData) {
  return {
    character: { ...defaultCharacter(), ...(saveData.character || {}) },
    row: 0,                       // 0 = name, 1..5 = the part slots
    lastMove: 0,
    goo: totalGoo(saveData)
  };
}

// Typing is handled by a real keydown listener, because a name needs letters
// and the rest of the game treats every key as "jump".
export function attachTyping(maker, target = window) {
  const onKey = (e) => {
    if (maker.nameField && document.activeElement === maker.nameField) return;
    if (maker.row !== 0) return;
    if (e.key === 'Backspace') {
      maker.character.name = maker.character.name.slice(0, -1);
      e.preventDefault();
    } else if (e.key.length === 1 && /[A-Za-z0-9 ]/.test(e.key) && maker.character.name.length < 12) {
      maker.character.name += e.key;
      e.preventDefault();
    }
  };
  target.addEventListener('keydown', onKey);
  return () => target.removeEventListener('keydown', onKey);
}

// Tap targets, because an iPad has no arrow keys and no Enter.
export function makerRects(view) {
  const left = view.w / 2 - 20;
  const rowY = (i) => 150 + i * 42;
  const rows = [];
  for (let i = 0; i <= SLOTS.length; i++) {
    rows.push({ id: 'row' + i, i, x: left - 8, y: rowY(i) - 22, w: 320, h: 34 });
  }
  const arrows = [];
  for (let i = 1; i <= SLOTS.length; i++) {
    arrows.push({ id: 'less', i, x: left + 96, y: rowY(i) - 22, w: 40, h: 34 });
    arrows.push({ id: 'more', i, x: left + 250, y: rowY(i) - 22, w: 40, h: 34 });
  }
  return {
    rows,
    arrows,
    name: { x: left + 96, y: rowY(0) - 22, w: 200, h: 34 },
    play: { x: view.w / 2 - 90, y: view.h - 108, w: 180, h: 52 }
  };
}

// The name box is a REAL text field sitting on top of the canvas.
//
// The first attempt hid it off-screen and called focus() from the game loop.
// iOS refuses both of those: the keyboard only appears for a visible input
// focused synchronously during a real tap. Letting the browser own the field
// means the tap lands on the input itself, and everything just works.
export function attachNameField(maker, doc = document) {
  let el = doc.getElementById('mm-name');
  if (!el) {
    el = doc.createElement('input');
    el.id = 'mm-name';
    el.type = 'text';
    el.maxLength = 12;
    el.placeholder = 'tap to type your name';
    el.autocapitalize = 'characters';
    el.autocomplete = 'off';
    el.spellcheck = false;
    doc.body.appendChild(el);
    el.addEventListener('input', () => {
      const clean = el.value.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 12);
      if (clean !== el.value) el.value = clean;
      maker.character.name = clean;
    });
    el.addEventListener('focus', () => { maker.row = 0; });
    // Keys typed into the box must not also drive the game behind it.
    el.addEventListener('keydown', (e) => e.stopPropagation());
    el.addEventListener('keyup', (e) => e.stopPropagation());
  }
  maker.nameField = el;
  return el;
}

// Park the real input exactly where the drawn Name row is.
export function showNameField(maker, view) {
  const el = maker.nameField;
  if (!el) return;
  const r = makerRects(view).name;
  el.style.display = 'block';
  el.style.left = `${r.x}px`;
  el.style.top = `${r.y}px`;
  el.style.width = `${r.w - 24}px`;
  el.style.height = `${r.h - 12}px`;
  if (el.value !== maker.character.name) el.value = maker.character.name;
}

export function hideNameField(maker) {
  if (maker.nameField) {
    maker.nameField.blur();
    maker.nameField.style.display = 'none';
  }
}

export function focusName(maker) {
  if (!maker.nameField) return;
  try { maker.nameField.focus(); } catch { /* ignore */ }
}

export function update(maker, input, now, view) {
  // --- taps ---
  if (input.pointerClick && view) {
    input.pointerClick = false;
    const r = makerRects(view);
    const px = input.pointerX, py = input.pointerY;

    if (hit(r.play, px, py)) return maker.character;

    if (hit(r.name, px, py)) { maker.row = 0; focusName(maker); return null; }

    for (const a of r.arrows) {
      if (hit(a, px, py)) {
        maker.row = a.i;
        const slot = SLOTS[a.i - 1];
        const n = slot.options.length;
        const step = a.id === 'more' ? 1 : -1;
        let idx = maker.character[slot.key];
        for (let tries = 0; tries < n; tries++) {
          idx = (idx + step + n) % n;
          if (isPartUnlocked(slot.options[idx], maker.goo)) break;
        }
        maker.character[slot.key] = idx;
        maker.lastMove = now;
        return null;
      }
    }

    for (const row of r.rows) {
      if (hit(row, px, py)) { maker.row = row.i; if (row.i === 0) focusName(maker); return null; }
    }
    return null;
  }

  if (now - maker.lastMove < 170) return null;

  if (input.down) { maker.row = Math.min(SLOTS.length, maker.row + 1); maker.lastMove = now; }
  if (input.up) { maker.row = Math.max(0, maker.row - 1); maker.lastMove = now; }

  if (maker.row > 0 && (input.left || input.right)) {
    const slot = SLOTS[maker.row - 1];
    const step = input.right ? 1 : -1;
    const n = slot.options.length;
    let i = maker.character[slot.key];
    // skip over anything still locked
    for (let tries = 0; tries < n; tries++) {
      i = (i + step + n) % n;
      if (isPartUnlocked(slot.options[i], maker.goo)) break;
    }
    maker.character[slot.key] = i;
    maker.lastMove = now;
  }

  if (input.confirm) return maker.character;
  return null;
}

export function draw(ctx, maker, view) {
  ctx.fillStyle = '#10241a';
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#7dff2e';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText('MONSTER MAKER', view.w / 2, 68);

  ctx.fillStyle = '#9ecfae';
  ctx.font = '14px system-ui, sans-serif';
  const next = nextUnlock(maker.goo);
  ctx.fillText(
    next
      ? `Goo Drops: ${maker.goo}   ·   next unlock "${next.name}" at ${next.needs}`
      : `Goo Drops: ${maker.goo}   ·   everything unlocked!`,
    view.w / 2, 94
  );

  // big preview
  const px = view.w / 2 - 130;
  const py = 150;
  ctx.fillStyle = '#0b1a12';
  ctx.fillRect(px - 90, py - 30, 180, 210);
  drawCharacter(ctx, maker.character, px - 36, py + 30, 72, 96, 1);

  // rows
  const left = view.w / 2 - 20;
  const rowY = (i) => 150 + i * 42;

  const nameChosen = maker.row === 0;
  ctx.textAlign = 'left';
  ctx.fillStyle = nameChosen ? '#7dff2e' : '#9ecfae';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('Name', left, rowY(0));
  // The name itself is drawn by a real <input> sitting over the canvas.

  SLOTS.forEach((slot, i) => {
    const y = rowY(i + 1);
    const chosen = maker.row === i + 1;
    const opt = slot.options[maker.character[slot.key]];
    const open = slot.options.filter((o) => isPartUnlocked(o, maker.goo)).length;

    ctx.fillStyle = chosen ? '#7dff2e' : '#9ecfae';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(slot.label, left, y);

    ctx.fillStyle = '#dfffcb';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(chosen ? `◀  ${opt.name}  ▶` : opt.name, left + 110, y);

    ctx.fillStyle = '#5e7a68';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`${open}/${slot.options.length}`, left + 300, y);
  });

  ctx.textAlign = 'center';
  const r = makerRects(view);
  ctx.textAlign = 'left';
  for (const a of r.arrows) {
    if (a.i !== maker.row) continue;
    drawButton(ctx, a, a.id === 'more' ? '▶' : '◀', { size: 16 });
  }
  drawButton(ctx, r.play, '▶  PLAY', { size: 17 });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#5e7a68';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Tap a row to change it, or use ↑ ↓ ← →', view.w / 2, view.h - 30);
  ctx.textAlign = 'left';
}
