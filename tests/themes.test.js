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
