import { describe, it, expect } from 'vitest';
import { isJumpKey } from '../src/systems/input.js';

describe('one-button controls', () => {
  it('jumps on any button that is not a movement key', () => {
    for (const code of ['Space', 'KeyJ', 'Enter', 'KeyZ', 'ShiftLeft', 'Digit1']) {
      expect(isJumpKey(code)).toBe(true);
    }
  });

  it('does not jump on the movement keys', () => {
    for (const code of ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']) {
      expect(isJumpKey(code)).toBe(false);
    }
  });

  it('ignores keys that would fight the browser', () => {
    for (const code of ['Tab', 'Escape', 'F5', 'F11']) {
      expect(isJumpKey(code)).toBe(false);
    }
  });
});
