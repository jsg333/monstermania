// CAN THIS LEVEL BE FINISHED?
//
// Treat every tile you could stand on as a node, connect them with the moves
// the player actually has, and see whether the exit is reachable from the
// start. Written for the tests first; the Level Maker now uses it too, so
// Ethan finds out his level is impossible while he's building it rather than
// after he's shared it with a friend.
//
// The movement model deliberately UNDER-estimates the player. A level this
// says is beatable definitely is. A level it says is stuck might still be
// beatable by someone very good — false alarms are cheap, shipping an
// impossible level is not.

import CONFIG from '../data/config.js';

const T = CONFIG.TILE;
export const JUMP_UP = Math.floor((CONFIG.JUMP_SPEED ** 2) / (2 * CONFIG.GRAVITY) / T);
export const JUMP_ACROSS = Math.floor(
  (CONFIG.RUN_SPEED * (2 * CONFIG.JUMP_SPEED / CONFIG.GRAVITY)) / T * 0.8
);
export const GOGIO_UP = Math.floor((CONFIG.GOGIO_BOUNCE_SPEED ** 2) / (2 * CONFIG.GRAVITY) / T);
export const FUNGY_ACROSS = 10;

export function reachableTiles(level) {
  const solid = (c, r) =>
    r >= 0 && r < level.rows && c >= 0 && c < level.cols && level.tiles[r][c] === 1;
  const standable = (c, r) => !solid(c, r) && solid(c, r + 1);
  const key = (c, r) => `${c},${r}`;

  const startCol = Math.round(level.spawn.x / T);
  let startRow = Math.round(level.spawn.y / T);
  while (startRow < level.rows - 1 && !solid(startCol, startRow + 1)) startRow++;

  const near = (list, c, r) =>
    list.find((m) => Math.abs(Math.round(m.x / T) - c) <= 1 && Math.abs(Math.round(m.y / T) - r) <= 1);

  const seen = new Set([key(startCol, startRow)]);
  const queue = [{ c: startCol, r: startRow }];

  while (queue.length) {
    const { c, r } = queue.shift();
    const add = (nc, nr) => {
      if (nc < 0 || nc >= level.cols || nr < 0 || nr >= level.rows) return;
      if (solid(nc, nr)) return;
      let rr = nr;
      while (rr < level.rows - 1 && !solid(nc, rr + 1)) rr++;
      if (!standable(nc, rr)) return;
      const k = key(nc, rr);
      if (!seen.has(k)) { seen.add(k); queue.push({ c: nc, r: rr }); }
    };

    for (let dc = -JUMP_ACROSS; dc <= JUMP_ACROSS; dc++) {
      for (let dr = -JUMP_UP; dr <= 6; dr++) {
        if (Math.abs(dc) + Math.max(0, -dr) > JUMP_ACROSS + JUMP_UP) continue;
        add(c + dc, r + dr);
      }
    }

    // Gogio launches you a long way up — but only as far as the first thing
    // above his head. Modelling the launch without the ceiling is how a Gogio
    // parked under a platform once passed as fine.
    const g = near(level.gogios, c, r);
    if (g) {
      const gcol = Math.round(g.x / T);
      let ceiling = 0;
      for (let rr = r - 1; rr >= 0; rr--) if (solid(gcol, rr)) { ceiling = rr + 1; break; }
      const top = Math.max(ceiling, r - GOGIO_UP);
      for (let dc = -8; dc <= 8; dc++) for (let nr = top; nr <= r; nr++) add(c + dc, nr);
    }

    if (near(level.fungies, c, r)) {
      for (let dc = -FUNGY_ACROSS; dc <= FUNGY_ACROSS; dc++) {
        for (let dr = -3; dr <= 4; dr++) add(c + dc, r + dr);
      }
    }

    for (const ick of level.ickios) {
      if (Math.round(ick.x / T) === c && Math.abs(Math.round(ick.y / T) - r) <= 1) {
        const twin = level.ickios.find((i) => i.id === ick.link);
        if (twin) add(Math.round(twin.x / T), Math.round(twin.y / T));
      }
    }
  }

  return seen;
}

export function canReach(level, target, seen = reachableTiles(level)) {
  if (!target) return false;
  const c = Math.round(target.x / T);
  const r = Math.round(target.y / T);
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -2; dr <= 2; dr++) if (seen.has(`${c + dc},${r + dr}`)) return true;
  }
  return false;
}

// Everything the Level Maker should warn Ethan about, in plain language.
export function checkLevel(level) {
  const problems = [];
  const warnings = [];

  if (!level.exit) problems.push('No Big Ickio — there’s no way to finish.');

  const seen = reachableTiles(level);
  if (level.exit && !canReach(level, level.exit, seen)) {
    problems.push('You can’t reach the Big Ickio. Nobody can finish this level.');
  }

  for (const g of level.gogios) {
    const col = g.x / T, row = g.y / T;
    for (let r = row - 1; r >= 0; r--) {
      if (level.tiles[r][col] === 1) {
        problems.push(`A Gogio has a platform right above him — you’d bonk your head.`);
        break;
      }
    }
  }

  for (const s of level.snoozers) {
    const col = s.x / T, row = s.y / T;
    let floor = null;
    for (let r = row + 1; r < level.rows; r++) if (level.tiles[r][col] === 1) { floor = r; break; }
    if (floor === null || floor - row > 1) {
      problems.push('A Snoozer is floating in the air — you’d die over and over there.');
      break;
    }
  }

  const lostCoins = level.gooDrops.filter((d) => !canReach(level, d, seen)).length;
  if (lostCoins) warnings.push(`${lostCoins} Goo Drop${lostCoins > 1 ? 's' : ''} can’t be reached.`);

  const lostSnoozers = level.snoozers.filter((s) => !canReach(level, s, seen)).length;
  if (lostSnoozers) warnings.push(`${lostSnoozers} Snoozer${lostSnoozers > 1 ? 's' : ''} can’t be reached.`);

  if (level.ickios.length % 2 !== 0) problems.push('Ickios come in pairs — you have an odd one.');
  if (!level.snoozers.length) warnings.push('No checkpoints. That’s harsh, but allowed.');

  return { ok: problems.length === 0, problems, warnings };
}
