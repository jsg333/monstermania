// One serializable object. Everything the game knows lives in here,
// which makes saving to localStorage and testing both easy.

import { createPlayer } from './systems/physics.js';
import testRoom from './data/levels/testRoom.js';

export function createState() {
  return {
    scene: 'play',
    level: testRoom,
    player: createPlayer(testRoom.spawn.x, testRoom.spawn.y),
    checkpoint: { ...testRoom.spawn },
    deaths: 0,
    gooDrops: 0,
    // Phase 6 fills this in from the Monster Maker
    character: { name: '', body: 0, color: 0, eyes: 0, mouth: 0, hat: 0 }
  };
}
