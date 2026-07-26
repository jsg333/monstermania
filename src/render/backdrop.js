// Background décor. Two flat corridors in the same colours are impossible to
// tell apart, which is exactly how 1-1 and 1-2 looked. This gives every level
// its own skyline without touching the level data.
//
// Everything is seeded off the level name, so a level looks identical every
// time you play it — but different from its neighbours.

import { themeFor } from '../data/themes.js';

function seeded(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function drawBackdrop(ctx, level, cam, view) {
  const theme = themeFor(level);
  const rand = seeded((level.id || level.name || 'x') + (theme.id || ''));
  const kind = theme.decor || 'pipes';

  ctx.save();
  ctx.fillStyle = theme.decorColor || '#1b3d2a';

  // Parallax: the backdrop drifts slower than the world, so depth reads even
  // on a flat level.
  const px = -cam.x * 0.35;
  const py = -cam.y * 0.2;
  ctx.translate(px, py);

  const spread = level.widthPx + view.w;
  const count = Math.max(6, Math.floor(spread / 190));

  for (let i = 0; i < count; i++) {
    const x = rand() * spread;
    const y = rand() * (level.heightPx * 0.85);
    const size = 30 + rand() * 90;

    if (kind === 'pipes') {
      const w = 16 + rand() * 14;
      ctx.fillRect(x, y, w, size);
      ctx.fillRect(x - 5, y - 8, w + 10, 10);
      ctx.fillRect(x - 5, y + size - 4, w + 10, 10);
    } else if (kind === 'drips') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 14, y);
      ctx.lineTo(x + 7, y + size * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'clouds') {
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.8, size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - size, y + size);
      ctx.lineTo(x, y);
      ctx.lineTo(x + size, y + size);
      ctx.closePath();
      ctx.fill();
    }
  }

  // A few slow bubbles, so the world looks alive rather than painted.
  ctx.fillStyle = theme.glowColor || '#2c5c3c';
  for (let i = 0; i < count; i++) {
    const x = rand() * spread;
    const y = rand() * level.heightPx;
    const r = 3 + rand() * 7;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
