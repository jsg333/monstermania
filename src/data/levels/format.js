// Levels are drawn as text. That's on purpose: Ethan can edit a level in any
// text editor by drawing it, long before the level maker exists.
//
//   1  a solid block          ^  a Grump (spikes)
//   .  empty air              S  a Snoozer (checkpoint)
//   P  where you start
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
  let spawn = null;

  rows.forEach((row, r) => {
    const padded = row.padEnd(width, '.');
    tiles.push([...padded].map((ch) => (ch === '1' ? 1 : 0)));

    [...padded].forEach((ch, c) => {
      if (ch === '^') grumps.push({ x: c * T, y: r * T });
      if (ch === 'S') snoozers.push({ x: c * T, y: r * T, awake: false });
      if (ch === 'P') spawn = { x: c * T + 4, y: r * T };
    });
  });

  if (!spawn) throw new Error(`Level "${name}" has no P (start point)`);

  return {
    name, tiles, grumps, snoozers, spawn,
    cols: width,
    rows: rows.length,
    widthPx: width * T,
    heightPx: rows.length * T
  };
}
