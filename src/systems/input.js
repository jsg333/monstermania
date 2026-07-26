// One-button input, exactly as Ethan specified:
// arrows or A/D to move, ANY other button to jump (keyboard, mouse, or touch).

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
// These do nothing, so they must not count as "any button".
const IGNORED = new Set(['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Tab', 'Escape', 'F5', 'F11']);

export function isJumpKey(code) {
  if (LEFT_KEYS.has(code) || RIGHT_KEYS.has(code)) return false;
  if (IGNORED.has(code)) return false;
  return true;
}

export function createInput(target = window) {
  const state = { left: false, right: false, jump: false, jumpPressedAt: -Infinity };
  const held = new Set();

  const press = (now) => { state.jump = true; state.jumpPressedAt = now; };

  const onKeyDown = (e) => {
    if (e.repeat) return;
    if (LEFT_KEYS.has(e.code)) { state.left = true; e.preventDefault(); return; }
    if (RIGHT_KEYS.has(e.code)) { state.right = true; e.preventDefault(); return; }
    if (isJumpKey(e.code)) { held.add(e.code); press(performance.now()); e.preventDefault(); }
  };

  const onKeyUp = (e) => {
    if (LEFT_KEYS.has(e.code)) { state.left = false; return; }
    if (RIGHT_KEYS.has(e.code)) { state.right = false; return; }
    held.delete(e.code);
    if (held.size === 0) state.jump = false;
  };

  // Mouse: left OR right click both jump (Ethan asked for right click specifically).
  const onMouseDown = (e) => { held.add('mouse' + e.button); press(performance.now()); };
  const onMouseUp = (e) => { held.delete('mouse' + e.button); if (held.size === 0) state.jump = false; };
  const onContextMenu = (e) => e.preventDefault();

  // Touch: left half of the screen steers, right half jumps.
  const onTouchStart = (e) => {
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.25) state.left = true;
      else if (t.clientX < window.innerWidth * 0.5) state.right = true;
      else { held.add('touch' + t.identifier); press(performance.now()); }
    }
    e.preventDefault();
  };
  const onTouchEnd = (e) => {
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.25) state.left = false;
      else if (t.clientX < window.innerWidth * 0.5) state.right = false;
      else held.delete('touch' + t.identifier);
    }
    if (held.size === 0) state.jump = false;
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('mousedown', onMouseDown);
  target.addEventListener('mouseup', onMouseUp);
  target.addEventListener('contextmenu', onContextMenu);
  target.addEventListener('touchstart', onTouchStart, { passive: false });
  target.addEventListener('touchend', onTouchEnd);
  target.addEventListener('blur', () => { held.clear(); state.left = state.right = state.jump = false; });

  return state;
}
