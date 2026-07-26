// One-button input, exactly as Ethan specified:
// arrows or A/D to move, ANY other button to jump (keyboard, mouse, or touch).

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const UP_KEYS = new Set(['ArrowUp', 'KeyW']);
const DOWN_KEYS = new Set(['ArrowDown', 'KeyS']);
// These do nothing in-game, so they must not count as "any button".
const IGNORED = new Set(['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Tab', 'Escape', 'F5', 'F11']);

// Where the on-screen controls live. Exported so the game can DRAW them in
// exactly the places that respond — invisible controls are a guessing game.
export function touchPads(w, h) {
  const size = Math.max(70, Math.min(120, h * 0.20));
  const pad = 20;
  const y = h - size - pad;
  return {
    left: { x: pad, y, w: size, h: size },
    right: { x: pad * 2 + size, y, w: size, h: size },
    jump: { x: w - pad - size * 1.5, y, w: size * 1.5, h: size }
  };
}

export function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function isJumpKey(code) {
  if (LEFT_KEYS.has(code) || RIGHT_KEYS.has(code)) return false;
  if (IGNORED.has(code)) return false;
  return true;
}

export function createInput(target = window) {
  const state = {
    left: false, right: false, up: false, down: false, confirm: false, escape: false,
    usingTouch: false,
    // Where the mouse/finger is, and whether it was just pressed. Menus need
    // real coordinates: cards look like buttons, so clicking one must pick
    // THAT card rather than launching whatever the keyboard had highlighted.
    pointerX: 0, pointerY: 0, pointerClick: false, pointerDown: false, jumpFromPointer: false,
    jump: false,             // is the button being held right now?
    jumpPressedAt: -Infinity, // when it was pressed
    jumpConsumed: true        // has this press already been used or thrown away?
  };
  const held = new Set();

  const press = (now) => { state.jump = true; state.jumpPressedAt = now; state.jumpConsumed = false; };

  const onKeyDown = (e) => {
    if (e.repeat) return;
    if (inUI(e)) return;
    if (LEFT_KEYS.has(e.code)) { state.left = true; e.preventDefault(); return; }
    if (RIGHT_KEYS.has(e.code)) { state.right = true; e.preventDefault(); return; }
    if (UP_KEYS.has(e.code)) { state.up = true; e.preventDefault(); }
    if (DOWN_KEYS.has(e.code)) { state.down = true; e.preventDefault(); }
    if (e.code === 'Enter') state.confirm = true;
    if (e.code === 'Escape') state.escape = true;
    if (isJumpKey(e.code)) { state.jumpFromPointer = false; held.add(e.code); press(performance.now()); e.preventDefault(); }
  };

  const onKeyUp = (e) => {
    if (LEFT_KEYS.has(e.code)) { state.left = false; return; }
    if (RIGHT_KEYS.has(e.code)) { state.right = false; return; }
    if (UP_KEYS.has(e.code)) state.up = false;
    if (DOWN_KEYS.has(e.code)) state.down = false;
    if (e.code === 'Enter') state.confirm = false;
    if (e.code === 'Escape') state.escape = false;
    held.delete(e.code);
    if (held.size === 0) state.jump = false;
  };

  // Clicks inside a UI panel (like the tuning panel) must not make you jump.
  const inUI = (e) => e.target && e.target.closest && e.target.closest('#tune');

  const onMouseMove = (e) => { state.pointerX = e.clientX; state.pointerY = e.clientY; };

  // Mouse: left OR right click both jump (Ethan asked for right click specifically).
  const onMouseDown = (e) => {
    if (inUI(e)) return;
    state.pointerX = e.clientX;
    state.pointerY = e.clientY;
    state.pointerClick = true;
    state.pointerDown = true;          // held, so the Level Maker can paint by dragging
    state.jumpFromPointer = true;
    held.add('mouse' + e.button);
    press(performance.now());
  };
  const onMouseUp = (e) => { state.pointerDown = false; held.delete('mouse' + e.button); if (held.size === 0) state.jump = false; };
  const onContextMenu = (e) => e.preventDefault();

  // ---- Touch ----
  //
  // The old version split the screen into invisible zones. Two problems: a kid
  // has no way to know they exist, and holding one while pressing another was
  // unreliable. These are real, drawn, finger-sized pads, and every touch event
  // recomputes which pads are currently held — so you can hold left and tap
  // jump at the same time, which platformers rather depend on.
  const live = new Map();

  const applyTouches = () => {
    const pads = touchPads(window.innerWidth, window.innerHeight);
    let left = false, right = false, jump = false;
    for (const { x, y } of live.values()) {
      if (inRect(pads.left, x, y)) left = true;
      else if (inRect(pads.right, x, y)) right = true;
      else jump = true;                       // anywhere else on screen jumps
    }
    state.left = left;
    state.right = right;
    if (jump && !state.jump) press(performance.now());
    if (!jump) { state.jump = false; }
  };

  const onTouchStart = (e) => {
    if (inUI(e)) return;
    state.usingTouch = true;
    for (const t of e.changedTouches) {
      live.set(t.identifier, { x: t.clientX, y: t.clientY });
      state.pointerX = t.clientX;
      state.pointerY = t.clientY;
    }
    state.pointerClick = true;
    state.pointerDown = true;
    state.jumpFromPointer = true;
    applyTouches();
    e.preventDefault();
  };

  // Without this a finger's position never updates, so you cannot drag to draw
  // in the Level Maker and sliding between pads does nothing.
  const onTouchMove = (e) => {
    if (inUI(e)) return;
    for (const t of e.changedTouches) {
      live.set(t.identifier, { x: t.clientX, y: t.clientY });
      state.pointerX = t.clientX;
      state.pointerY = t.clientY;
    }
    applyTouches();
    e.preventDefault();
  };

  const onTouchEnd = (e) => {
    for (const t of e.changedTouches) live.delete(t.identifier);
    if (live.size === 0) state.pointerDown = false;
    applyTouches();
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('mousemove', onMouseMove);
  target.addEventListener('mousedown', onMouseDown);
  target.addEventListener('mouseup', onMouseUp);
  target.addEventListener('contextmenu', onContextMenu);
  target.addEventListener('touchstart', onTouchStart, { passive: false });
  target.addEventListener('touchmove', onTouchMove, { passive: false });
  target.addEventListener('touchend', onTouchEnd);
  target.addEventListener('touchcancel', onTouchEnd);
  target.addEventListener('blur', () => { held.clear(); state.left = state.right = state.jump = false; });

  return state;
}

// Ask the input system for a jump. Returns true exactly once per press.
//
// This is the fix for "the jump feels unresponsive". A key press happens
// BETWEEN two animation frames, so by the time the game looks at it, a
// millisecond or two has already gone by. The old code demanded the press
// land in the same instant as the frame, which happened only by luck — so
// roughly half of Ethan's jumps were being thrown on the floor.
//
// Now a press waits until the game asks for it. Ethan's rule still holds:
// with JUMP_BUFFER_MS at 0, a press made in mid-air is thrown away
// immediately instead of being saved up for landing. If you do not jump in
// time, you fall. It just no longer loses presses you actually made in time.
export function takeJump(input, allowed, now, cfg) {
  if (input.jumpConsumed) return false;

  if (allowed) {
    input.jumpConsumed = true;
    return true;
  }

  // Couldn't jump this frame. Keep the press only for as long as the
  // buffer allows (0ms by default = not at all).
  if (now - input.jumpPressedAt > cfg.JUMP_BUFFER_MS) input.jumpConsumed = true;
  return false;
}
