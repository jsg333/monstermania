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

// An iPad only shows its keyboard for a real text field, so keep an invisible
// one off-screen and focus it when the player wants to type their name.
export function attachNameField(maker, doc = document) {
  let el = doc.getElementById('mm-name');
  if (!el) {
    el = doc.createElement('input');
    el.id = 'mm-name';
    el.type = 'text';
    el.maxLength = 12;
    el.autocapitalize = 'characters';
    el.style.cssText =
      'position:fixed;left:-2000px;top:0;width:10px;height:10px;opacity:0;';
    doc.body.appendChild(el);
    el.addEventListener('input', () => {
      maker.character.name = el.value.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 12);
    });
  }
  maker.nameField = el;
  return el;
}

export function focusName(maker) {
  if (!maker.nameField) return;
  maker.nameField.value = maker.character.name;
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
  ctx.fillStyle = '#dfffcb';
  ctx.font = '18px system-ui, sans-serif';
  const shownName = maker.character.name || (nameChosen ? '' : 'type a name');
  ctx.fillText(shownName + (nameChosen ? '_' : ''), left + 110, rowY(0));

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
