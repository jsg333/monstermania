export function drawFps(ctx, fps) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(8, 8, 92, 26);
  ctx.fillStyle = '#9cff6b';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`${Math.round(fps)} fps`, 16, 26);
  ctx.restore();
}

export function drawHint(ctx, text, y) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(text, 16, y);
  ctx.restore();
}
