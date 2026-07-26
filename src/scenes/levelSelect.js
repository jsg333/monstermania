// Level select. Arrow keys move, any other button starts — the same
// one-button rule as the game itself.

import CONFIG from '../data/config.js';
import { isUnlocked, totalGoo } from '../systems/save.js';
import { drawCharacter } from '../render/sprites.js';

export function update(sel, input, now) {
  if (now - sel.lastMove > 180) {
    if (input.right) { sel.index = Math.min(sel.levels.length - 1, sel.index + 1); sel.lastMove = now; }
    if (input.left) { sel.index = Math.max(0, sel.index - 1); sel.lastMove = now; }
  }
  if (input.up && now - sel.openedAt > 300) { sel.openMaker = true; return null; }
  if (input.jump && now - sel.openedAt > 300 && isUnlocked(sel.save, sel.levels, sel.index)) {
    return sel.levels[sel.index];
  }
  return null;
}

export function draw(ctx, sel, view) {
  ctx.fillStyle = '#10241a';
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7dff2e';
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.fillText('MONSTERMANIA', view.w / 2, 90);

  ctx.fillStyle = '#9ecfae';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('World 1 — Slime Lab', view.w / 2, 120);
  ctx.fillText(`Goo Drops collected: ${totalGoo(sel.save)}`, view.w / 2, 144);

  if (sel.save.character) {
    drawCharacter(ctx, sel.save.character, view.w / 2 - 18, 168, 36, 48, 1);
    if (sel.save.character.name) {
      ctx.fillStyle = '#dfffcb';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(sel.save.character.name, view.w / 2, 236);
    }
  }

  const cardW = 132, cardH = 92, gap = 16;
  const total = sel.levels.length * cardW + (sel.levels.length - 1) * gap;
  const startX = view.w / 2 - total / 2;
  const y = view.h / 2 - cardH / 2;

  sel.levels.forEach((lv, i) => {
    const x = startX + i * (cardW + gap);
    const open = isUnlocked(sel.save, sel.levels, i);
    const chosen = i === sel.index;

    ctx.fillStyle = open ? (chosen ? '#2f6b45' : '#1b3d29') : '#171f1a';
    ctx.fillRect(x, y, cardW, cardH);
    if (chosen) {
      ctx.strokeStyle = '#7dff2e';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 1.5, y - 1.5, cardW + 3, cardH + 3);
    }

    ctx.fillStyle = open ? '#dfffcb' : '#4a5a4f';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(open ? lv.id : '🔒', x + cardW / 2, y + 34);

    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = open ? '#9ecfae' : '#3f4d44';
    const title = lv.title.length > 17 ? lv.title.slice(0, 16) + '…' : lv.title;
    ctx.fillText(open ? title : 'locked', x + cardW / 2, y + 58);

    if (sel.save.cleared[lv.id]) {
      ctx.fillStyle = '#7dff2e';
      ctx.font = '12px system-ui, sans-serif';
      const got = sel.save.gooDrops[lv.id] || 0;
      ctx.fillText(`✓  ${got} / ${lv.gooDrops.length} goo`, x + cardW / 2, y + 78);
    }
  });

  ctx.fillStyle = '#9cff6b';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('← →  to choose      ANY other button to play      ↑  Monster Maker', view.w / 2, view.h - 60);
  ctx.textAlign = 'left';
}
