import { describe, it, expect } from 'vitest';
import { THEMES, WORLD_THEMES, themeFor } from '../src/data/themes.js';
import world1 from '../src/data/levels/world1.js';

describe('theme packs', () => {
  it('has the four worlds Ethan named', () => {
    expect(WORLD_THEMES).toEqual(['slimeLab', 'gluetown', 'cloudCastle', 'monsterMountain']);
    expect(WORLD_THEMES.map((k) => THEMES[k].name))
      .toEqual(['Slime Lab', 'Gluetown', 'Cloud Castle', 'Monster Mountain']);
  });

  it('gives every theme its own colours, so no two worlds look alike', () => {
    const skies = WORLD_THEMES.map((k) => THEMES[k].sky);
    expect(new Set(skies).size).toBe(skies.length);
    const blocks = WORLD_THEMES.map((k) => THEMES[k].block);
    expect(new Set(blocks).size).toBe(blocks.length);
  });

  it('keeps the platform top brighter than the block, so ledges stay readable', () => {
    const brightness = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
    };
    for (const key of WORLD_THEMES) {
      const t = THEMES[key];
      expect(brightness(t.blockTop), t.name).toBeGreaterThan(brightness(t.block));
      expect(brightness(t.block), t.name).toBeGreaterThan(brightness(t.sky));
    }
  });

  it('falls back to Slime Lab rather than crashing on an unknown theme', () => {
    expect(themeFor({ theme: 'nonsense' }).id).toBe('slimeLab');
    expect(themeFor(null).id).toBe('slimeLab');
    expect(themeFor({}).id).toBe('slimeLab');
  });

  it('puts all of World 1 in the Slime Lab', () => {
    for (const l of world1) expect(l.theme).toBe('slimeLab');
    expect(themeFor(world1[0]).name).toBe('Slime Lab');
  });
});

// 1-1 and 1-2 were indistinguishable: two flat green corridors. A level needs
// its own silhouette or players can't tell where they are.
describe('levels do not all look the same', () => {
  it('gives every theme its own décor style', async () => {
    const { THEMES, WORLD_THEMES } = await import('../src/data/themes.js');
    const kinds = WORLD_THEMES.map((k) => THEMES[k].decor);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it('draws a different backdrop for each level, and the same one every time', async () => {
    const { drawBackdrop } = await import('../src/render/backdrop.js');
    const world1 = (await import('../src/data/levels/world1.js')).default;

    const record = (level) => {
      const calls = [];
      const ctx = new Proxy({ canvas: { width: 1280, height: 720 } }, {
        get: (t, k) => (k in t ? t[k] : (...a) => calls.push(k + ':' + a.map((n) => (typeof n === 'number' ? n.toFixed(1) : n)).join(','))),
        set: (t, k, v) => ((t[k] = v), true)
      });
      drawBackdrop(ctx, level, { x: 0, y: 0 }, { w: 1280, h: 720 });
      return calls.join('|');
    };

    const a1 = record(world1[0]);
    const a2 = record(world1[0]);
    const b = record(world1[1]);
    expect(a1).toBe(a2);          // same level always looks the same
    expect(a1).not.toBe(b);       // different levels do not
  });
});
