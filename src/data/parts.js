// The Monster Maker's parts box.
//
// Ethan's ruling: the player names their own character and builds their own
// look. Build-a-character from parts beats free drawing — it's faster to make,
// every combination still looks good, and nothing can come out ugly or rude.
//
// Parts unlock with Goo Drops, so every coin makes YOUR guy cooler. `needs`
// is how many Goo Drops you must have collected in total.

export const BODIES = [
  { id: 'blocky', name: 'Blocky', needs: 0 },
  { id: 'round',  name: 'Round',  needs: 0 },
  { id: 'tall',   name: 'Tall',   needs: 5 },
  { id: 'blob',   name: 'Blob',   needs: 12 }
];

export const COLORS = [
  { id: '#ffd54a', name: 'Sunshine',  needs: 0 },
  { id: '#7dff2e', name: 'Slime',     needs: 0 },
  { id: '#39b0ff', name: 'Sky',       needs: 0 },
  { id: '#ff6b6b', name: 'Tomato',    needs: 2 },
  { id: '#c58bff', name: 'Grape',     needs: 4 },
  { id: '#ff9f43', name: 'Pumpkin',   needs: 7 },
  { id: '#4ee8c0', name: 'Mint',      needs: 10 },
  { id: '#ff5fd2', name: 'Bubblegum', needs: 14 }
];

export const EYES = [
  { id: 'dot',    name: 'Dots',    needs: 0 },
  { id: 'big',    name: 'Big',     needs: 0 },
  { id: 'angry',  name: 'Angry',   needs: 3 },
  { id: 'sleepy', name: 'Sleepy',  needs: 8 }
];

export const MOUTHS = [
  { id: 'smile', name: 'Smile', needs: 0 },
  { id: 'grin',  name: 'Grin',  needs: 0 },
  { id: 'fangs', name: 'Fangs', needs: 6 },
  { id: 'ooh',   name: 'Ooh',   needs: 9 }
];

export const HATS = [
  { id: 'none',    name: 'No hat',  needs: 0 },
  { id: 'cap',     name: 'Cap',     needs: 0 },
  { id: 'antenna', name: 'Antenna', needs: 1 },
  { id: 'horns',   name: 'Horns',   needs: 5 },
  { id: 'crown',   name: 'Crown',   needs: 11 },
  { id: 'golden',  name: 'Golden',  needs: 20 }   // bonus-level bragging rights
];

export const SLOTS = [
  { key: 'body',  label: 'Body',  options: BODIES },
  { key: 'color', label: 'Colour', options: COLORS },
  { key: 'eyes',  label: 'Eyes',  options: EYES },
  { key: 'mouth', label: 'Mouth', options: MOUTHS },
  { key: 'hat',   label: 'Hat',   options: HATS }
];

export function defaultCharacter() {
  return { name: '', body: 0, color: 0, eyes: 0, mouth: 0, hat: 0 };
}

export function isPartUnlocked(option, totalGoo) {
  return totalGoo >= option.needs;
}

export function unlockedCount(options, totalGoo) {
  return options.filter((o) => isPartUnlocked(o, totalGoo)).length;
}

// How many parts are still locked, and what the next one costs.
export function nextUnlock(totalGoo) {
  const all = SLOTS.flatMap((s) => s.options);
  const locked = all.filter((o) => o.needs > totalGoo).sort((a, b) => a.needs - b.needs);
  return locked.length ? locked[0] : null;
}
