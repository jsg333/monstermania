// One serializable object. Everything the game knows lives in here,
// which makes saving to localStorage and testing both easy.

import { createPlayer } from './systems/physics.js';
import { createCamera } from './systems/camera.js';
import playground from './data/levels/playground.js';
import { instantiate } from './data/levels/format.js';

export function createState(sourceLevel = playground) {
  // Always play a fresh copy — see instantiate() for why.
  const level = instantiate(sourceLevel);
  return {
    scene: 'play',
    level,
    player: createPlayer(level.spawn.x, level.spawn.y),
    cam: createCamera(),
    checkpoint: { ...level.spawn },
    deadUntil: 0,
    puff: [],
    time: 0,
    deaths: 0,
    gooDrops: 0,
    // Phase 6 fills this in from the Monster Maker
    character: { name: '', body: 0, color: 0, eyes: 0, mouth: 0, hat: 0 }
  };
}
