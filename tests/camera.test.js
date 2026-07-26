import { describe, it, expect } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createCamera, followCamera, easeCamera } from '../src/systems/camera.js';
import { createPlayer } from '../src/systems/physics.js';

const view = { w: 800, h: 600 };
const level = { widthPx: 4000, heightPx: 1200 };

describe('camera', () => {
  it('never shows the empty space past the left edge', () => {
    const cam = followCamera(createCamera(), createPlayer(0, 0), view, level);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('never shows the empty space past the right edge', () => {
    const cam = followCamera(createCamera(), createPlayer(level.widthPx, 0), view, level);
    expect(cam.x).toBe(level.widthPx - view.w);
  });

  it('follows the player once they leave the dead zone', () => {
    const start = { x: 1000, y: 300 };
    const p = createPlayer(1000 + view.w / 2 + CONFIG.CAMERA_DEADZONE + 50, 300 + view.h / 2);
    const cam = followCamera(start, p, view, level);
    expect(cam.x).toBeGreaterThan(start.x);
  });

  it('ignores small movements inside the dead zone', () => {
    const start = { x: 1000, y: 300 };
    const p = createPlayer(1000 + view.w / 2 + 10, 300 + view.h / 2);
    expect(followCamera(start, p, view, level).x).toBe(start.x);
  });

  it('centres a level smaller than the screen instead of clamping oddly', () => {
    const tiny = { widthPx: 400, heightPx: 300 };
    const cam = followCamera(createCamera(), createPlayer(200, 150), view, tiny);
    expect(cam.x).toBeCloseTo((tiny.widthPx - view.w) / 2, 5);
  });

  it('eases toward the target instead of snapping', () => {
    const eased = easeCamera({ x: 0, y: 0 }, { x: 100, y: 0 }, 1 / 60);
    expect(eased.x).toBeGreaterThan(0);
    expect(eased.x).toBeLessThan(100);
  });
});
