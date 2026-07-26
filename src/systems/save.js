// Progress lives in localStorage. Small, forgiving, and never throws — if
// storage is unavailable the game still plays, you just don't keep progress.

const KEY = 'monstermania.save.v1';

export function blankSave() {
  return { cleared: {}, gooDrops: {}, character: null };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankSave();
    return { ...blankSave(), ...JSON.parse(raw) };
  } catch {
    return blankSave();
  }
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
  return data;
}

export function recordClear(data, levelId, gooDrops) {
  const next = { ...data, cleared: { ...data.cleared }, gooDrops: { ...data.gooDrops } };
  next.cleared[levelId] = true;
  next.gooDrops[levelId] = Math.max(next.gooDrops[levelId] || 0, gooDrops);
  return save(next);
}

// You can always play level 1, plus anything after a level you've cleared.
export function isUnlocked(data, levels, index) {
  if (index === 0) return true;
  return !!data.cleared[levels[index - 1].id];
}

export function totalGoo(data) {
  return Object.values(data.gooDrops).reduce((a, b) => a + b, 0);
}
