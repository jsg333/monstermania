// Levels are drawn as text. That's on purpose: Ethan can edit a level in any
// text editor by drawing it, long before the level maker exists.
//
//   1  a solid block          ^  a Grump (spikes)
//   .  empty air              S  a Snoozer (checkpoint)
//   P  where you start        f  a Fungy (small forward hop)
//   o  a Goo Drop (a coin)    g  a Gogio (big bounce, gets tired)
//   i  an Ickio (they pair up two at a time, in reading order)
//   E  the BIG Ickio — dive in here to finish the level
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
  const gooDrops = [];
  const ickios = [];
  let exit = null;
  let spawn = null;

  rows.forEach((row, r) => {
    const padded = row.padEnd(width, '.');
    tiles.push([...padded].map((ch) => (ch === '1' ? 1 : 0)));

    [...padded].forEach((ch, c) => {
      if (ch === '^') grumps.push({ x: c * T, y: r * T });
      if (ch === 'S') snoozers.push({ x: c * T, y: r * T, awake: false });
      if (ch === 'f') fungies.push({ x: c * T, y: r * T, lastBounceAt: -Infinity, squash: 0 });
      if (ch === 'g') gogios.push({ x: c * T, y: r * T, bounces: 0, lastBounceAt: -Infinity, squash: 0 });
      if (ch === 'o') gooDrops.push({ x: c * T, y: r * T, taken: false });
      if (ch === 'i') ickios.push({ x: c * T, y: r * T, id: ickios.length, link: null });
      if (ch === 'E') exit = { x: c * T, y: r * T };
      if (ch === 'P') spawn = { x: c * T + 4, y: r * T };
    });
  });

  if (!spawn) throw new Error(`Level "${name}" has no P (start point)`);

  // Ickios pair up two at a time, in the order they appear.
  if (ickios.length % 2 !== 0) {
    throw new Error(`Level "${name}" has ${ickios.length} Ickios — they must come in pairs`);
  }
  for (let i = 0; i < ickios.length; i += 2) {
    ickios[i].link = ickios[i + 1].id;
    ickios[i + 1].link = ickios[i].id;
  }

  return {
    name, tiles, grumps, snoozers, fungies, gogios, gooDrops, ickios, exit, spawn,
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
    gogios: level.gogios.map((g) => ({ ...g, bounces: 0, lastBounceAt: -Infinity, squash: 0 })),
    gooDrops: level.gooDrops.map((d) => ({ ...d, taken: false })),
    ickios: level.ickios.map((i) => ({ ...i }))
  };
}
