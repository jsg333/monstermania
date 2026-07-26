import { describe, it, expect, beforeAll } from 'vitest';
import CONFIG from '../src/data/config.js';
import { createPlayer } from '../src/systems/physics.js';
import { createState } from '../src/state.js';
import * as play from '../src/scenes/play.js';
import { parseLevel } from '../src/data/levels/format.js';
import { spikeBox, landingBox, touchingSpikes, applyBouncers } from '../src/systems/bouncers.js';
import { collectGoo, gooBox } from '../src/systems/hazards.js';

const T = CONFIG.TILE;
const NOW = 10_000;
// Keep the two monsters well apart, or a test aimed at one accidentally
// overlaps the other.
const level = () => parseLevel('t', `
1111111
1P.f.g1
1111111
`);

beforeAll(() => { globalThis.window = { devicePixelRatio: 1 }; });

// Ethan's ruling: land on top of a monster or his spikes get you.
describe("a monster's sides are dangerous", () => {
  const m = { x: 3 * T, y: T };

  it('puts the spikes below the landing band, never on the top', () => {
    const land = landingBox(m);
    const spikes = spikeBox(m);
    expect(spikes.y).toBeGreaterThanOrEqual(land.y + land.h - 0.001);
  });

  it('kills you if you walk into his side', () => {
    const l = level();
    const f = l.fungies[0];
    const walker = { ...createPlayer(f.x - 6, f.y + 8), vy: 0 };
    expect(touchingSpikes(walker, l)).toBe(true);
  });

  it('leaves you alone when you are standing on top of him', () => {
    const l = level();
    const f = l.fungies[0];
    const onTop = { ...createPlayer(f.x, f.y - 32), vy: 0 };
    expect(touchingSpikes(onTop, l)).toBe(false);
  });

  it('shaves the spikes in on each side so brushing past is survivable', () => {
    const s = spikeBox(m);
    expect(s.x).toBeGreaterThan(m.x);
    expect(s.x + s.w).toBeLessThan(m.x + T);
  });

  // The whole point: monsters must still be usable. If landing on top were
  // ever fatal the game would be unplayable, so this is worth pinning down.
  it('keeps the top a big, forgiving target', () => {
    expect(CONFIG.LANDING_BAND).toBeGreaterThanOrEqual(0.5);
    expect(landingBox(m).h).toBeGreaterThan(T * 0.5);
  });

  it('bouncing beats the spikes on the same frame', () => {
    const l = level();
    const g = l.gogios[0];
    const falling = { ...createPlayer(g.x, g.y - 8), vy: 400 };  // g is clear of Fungy
    const out = applyBouncers(falling, l, NOW, CONFIG, 400);
    expect(out.bounced).toBe('gogio');
  });
});

describe('Goo Drops', () => {
  const l = () => parseLevel('t', `
1111
1P.1
1o.1
1111
`);

  it('is collected when you touch it', () => {
    const lv = l();
    const d = lv.gooDrops[0];
    const p = { ...createPlayer(d.x, d.y) };
    expect(collectGoo(p, lv)).toBe(1);
    expect(lv.gooDrops[0].taken).toBe(true);
  });

  it('can only be collected once', () => {
    const lv = l();
    const d = lv.gooDrops[0];
    const p = { ...createPlayer(d.x, d.y) };
    collectGoo(p, lv);
    expect(collectGoo(p, lv)).toBe(0);
  });

  it('is not collected from across the room', () => {
    const lv = l();
    expect(collectGoo({ ...createPlayer(0, 0) }, lv)).toBe(0);
  });

  it('has a slightly forgiving pickup box', () => {
    const d = { x: 0, y: 0 };
    expect(gooBox(d).w).toBeLessThan(T);
  });

  it('comes back if you play the level again', () => {
    const a = createState();
    a.level.gooDrops.forEach((d) => (d.taken = true));
    const b = createState();
    expect(b.level.gooDrops.every((d) => !d.taken)).toBe(true);
  });
});

describe('the playground rewards the Gogio climb with a coin', () => {
  it('has a Goo Drop up on the high shelf', () => {
    const state = createState();
    expect(state.level.gooDrops.length).toBeGreaterThan(0);
    const highest = Math.min(...state.level.gooDrops.map((d) => d.y));
    expect(highest).toBeLessThan(6 * T);   // above the shelf row
  });

  it('counts up when you grab one while playing', () => {
    const state = createState();
    const d = state.level.gooDrops[0];
    state.player = { ...state.player, x: d.x, y: d.y };
    const input = { left: false, right: false, jump: false, jumpPressedAt: -Infinity, jumpConsumed: true };
    play.update(state, input, 0.0167, 1000);
    expect(state.gooDrops).toBe(1);
  });
});
