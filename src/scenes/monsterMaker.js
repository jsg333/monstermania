// THE MONSTER MAKER — Ethan's ruling: the player names their own character
// and builds their own look. Parts unlock with Goo Drops, so every coin you
// find makes YOUR guy cooler.
//
// Controls stay simple: ← → pick a part, ↑ ↓ move between rows, type to name
// yourself, Enter to play.

import { SLOTS, isPartUnlocked, nextUnlock, defaultCharacter } from '../data/parts.js';
import { totalGoo } from '../systems/save.js';
import { drawCharacter } from '../render/sprites.js';

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

export function update(maker, input, now) {
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
  ctx.fillStyle = '#9cff6b';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('↑ ↓ pick a row    ← → change it    type your name    ENTER to play',
    view.w / 2, view.h - 54);
  ctx.textAlign = 'left';
}
