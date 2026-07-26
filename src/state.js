// One serializable object. Everything the game knows lives in here,
// which makes saving to localStorage and testing both easy.

import { createPlayer } from './systems/physics.js';
import { createCamera } from './systems/camera.js';
import playground from './data/levels/playground.js';
import { createBoss } from './systems/boss.js';
import { instantiate } from './data/levels/format.js';

// Play the same level again from scratch.
export function restart(state) {
  return createState(state.sourceLevel, state.character);
}

export function createState(sourceLevel = playground, character = null) {
  // Always play a fresh copy — see instantiate() for why.
  const level = instantiate(sourceLevel);
  return {
    scene: 'play',
    sourceLevel,
    level,
    player: createPlayer(level.spawn.x, level.spawn.y),
    cam: createCamera(),
    checkpoint: { ...level.spawn },
    deadUntil: 0,
    puff: [],
    time: 0,
    deaths: 0,
    gooDrops: 0,
    warps: 0,
    won: 0,
    boss: sourceLevel.boss ? createBoss(level) : null,
    character
  };
}
