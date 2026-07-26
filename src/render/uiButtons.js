// On-screen buttons. The game is played on an iPad as well as a laptop, and
// an iPad has no ESC key and no arrow keys — so every keyboard-only route
// needs a thing you can actually tap.

export function drawButton(ctx, r, label, opts = {}) {
  const { bg = '#1b3d29', fg = '#dfffcb', border = '#4ea86a', size = 14 } = opts;
  ctx.fillStyle = bg;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = fg;
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function hit(r, x, y) {
  return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Fingers are much bigger than mouse pointers. Anything tappable should be at
// least this many pixels on its short side.
export const MIN_TAP = 44;
