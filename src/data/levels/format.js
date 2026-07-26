// Levels are drawn as text. That's on purpose: Ethan can edit a level in any
// text editor by drawing it, long before the level maker exists.
//
//   1  a solid block          ^  a Grump (spikes)
//   .  empty air              S  a Snoozer (checkpoint)
//   P  where you start        f  a Fungy (small forward hop)
//                             g  a Gogio (big bounce, gets tired)
//
// Everything that isn't a solid block becomes empty air, so you can leave
// blank space or use dots, whichever is easier to see.

import CONFIG from '../config.js';

export function parseLevel(name, map, cfg = CONFIG) {
  const rows = map.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const width = Math.max(...rows.map((r) => r.length));
  const T = cfg.TILE;

  const tiles = [];
  const grumps = [];
  const snoozers = [];
  const fungies = [];
  const gogios = [];
  let spawn = null;

  rows.forEach((row, r) => {
    const padded = row.padEnd(width, '.');
    tiles.push([...padded].map((ch) => (ch === '1' ? 1 : 0)));

    [...padded].forEach((ch, c) => {
      if (ch === '^') grumps.push({ x: c * T, y: r * T });
      if (ch === 'S') snoozers.push({ x: c * T, y: r * T, awake: false });
      if (ch === 'f') fungies.push({ x: c * T, y: r * T, lastBounceAt: -Infinity, squash: 0 });
      if (ch === 'g') gogios.push({ x: c * T, y: r * T, bounces: 0, lastBounceAt: -Infinity, squash: 0 });
      if (ch === 'P') spawn = { x: c * T + 4, y: r * T };
    });
  });

  if (!spawn) throw new Error(`Level "${name}" has no P (start point)`);

  return {
    name, tiles, grumps, snoozers, fungies, gogios, spawn,
    cols: width,
    rows: rows.length,
    widthPx: width * T,
    heightPx: rows.length * T
  };
}

// A parsed level is a shared, module-level object, but Snoozers wake up and
// Gogio gets tired — those live ON the monsters. Without a fresh copy per
// playthrough, restarting a level would hand you a world where every
// checkpoint is already used and Gogio is permanently flat.
export function instantiate(level) {
  return {
    ...level,
    snoozers: level.snoozers.map((s) => ({ ...s, awake: false })),
    fungies: level.fungies.map((f) => ({ ...f, lastBounceAt: -Infinity, squash: 0 })),
    gogios: level.gogios.map((g) => ({ ...g, bounces: 0, lastBounceAt: -Infinity, squash: 0 }))
  };
}
