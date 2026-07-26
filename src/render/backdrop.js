// Background décor. Two flat corridors in the same colours are impossible to
// tell apart, which is exactly how 1-1 and 1-2 looked.
//
// THE RULE THAT MATTERS HERE: background shapes must never look like
// platforms. In a platformer a flat horizontal top edge means "stand on me" —
// it's the most basic visual promise the genre makes. The first version of
// this file drew pipes with flat tops and flanges floating in mid-air, and a
// playtester immediately asked whether they were solid. If a grown-up has to
// ask, a kid will jump at them and feel cheated.
//
// So everything back here:
//   * has NO flat horizontal top edge — only curves, points and hanging stems
//   * hangs from above or sits far behind, never floats in open space
//   * stays close to the sky colour, well below platform brightness
//   * drifts at a different speed, so parallax marks it as "far away"
//
// Everything is seeded off the level id, so a level looks identical every time
// you play it, but different from its neighbours.

import { themeFor } from '../data/themes.js';

function seeded(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// A pipe that hangs from off the top of the screen and ends in a rounded
// nozzle. No flat top, nothing to stand on, clearly suspended from above.
function hangingPipe(ctx, x, top, len, w) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top - 400);
  ctx.lineTo(x + w / 2, top - 400);
  ctx.lineTo(x + w / 2, top + len);
  ctx.arc(x, top + len, w / 2, 0, Math.PI);
  ctx.lineTo(x - w / 2, top - 400);
  ctx.closePath();
  ctx.fill();
}

function drip(ctx, x, y, len, w) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - 400);
  ctx.lineTo(x + w / 2, y - 400);
  ctx.quadraticCurveTo(x + w / 2, y + len, x, y + len);
  ctx.quadraticCurveTo(x - w / 2, y + len, x - w / 2, y - 400);
  ctx.closePath();
  ctx.fill();
}

export function drawBackdrop(ctx, level, cam, view) {
  const theme = themeFor(level);
  const rand = seeded((level.id || level.name || 'x') + (theme.id || ''));
  const kind = theme.decor || 'pipes';

  ctx.save();
  ctx.globalAlpha = 0.55;                 // sits back, never competes
  ctx.fillStyle = theme.decorColor || '#16301f';

  // Parallax: the backdrop drifts slower than the world, so it reads as far
  // away rather than as something you could touch.
  ctx.translate(-cam.x * 0.3, -cam.y * 0.15);

  const spread = level.widthPx + view.w;
  const count = Math.max(5, Math.floor(spread / 240));

  for (let i = 0; i < count; i++) {
    const x = rand() * spread;
    const y = rand() * (level.heightPx * 0.5);      // upper half only
    const len = 40 + rand() * 110;

    if (kind === 'pipes') hangingPipe(ctx, x, y, len, 16 + rand() * 12);
    else if (kind === 'drips') drip(ctx, x, y, len, 12 + rand() * 10);
    else if (kind === 'clouds') {
      ctx.beginPath();
      ctx.ellipse(x, y, len * 0.9, len * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Peaks are anchored to the very bottom, so they read as distant
      // mountains behind the level rather than ledges inside it.
      const base = level.heightPx;
      ctx.beginPath();
      ctx.moveTo(x - len, base);
      ctx.quadraticCurveTo(x, base - len * 1.6, x + len, base);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Slow bubbles — round, so they can never be mistaken for a ledge.
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = theme.glowColor || '#2c5c3c';
  for (let i = 0; i < count * 2; i++) {
    const x = rand() * spread;
    const y = rand() * level.heightPx;
    const r = 2 + rand() * 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
