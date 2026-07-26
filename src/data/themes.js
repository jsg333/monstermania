// The four Theme Packs — Ethan's names, chosen 2026-07-25.
//
// This came from his original idea: "different design for people that have
// different taste". A theme changes how the whole world looks; the platforms
// and monsters play exactly the same underneath.
//
// Colours live here so a theme is a data change, never a code change.

export const THEMES = {
  slimeLab: {
    id: 'slimeLab',
    name: 'Slime Lab',
    blurb: 'Green goo, pipes and bubbling tanks',
    sky: '#10241a',
    block: '#2f6b45',
    blockTop: '#4ea86a',
    decor: 'pipes',
    decorColor: '#1b3d2a',
    glowColor: '#2c5c3c'
  },
  gluetown: {
    id: 'gluetown',
    name: 'Gluetown',
    blurb: 'Everything sticks — walls are floors here',
    sky: '#241a10',
    block: '#7a5a2f',
    blockTop: '#c99a4e',
    decor: 'drips',
    decorColor: '#3a2a15',
    glowColor: '#5c4322'
  },
  cloudCastle: {
    id: 'cloudCastle',
    name: 'Cloud Castle',
    blurb: 'High, floaty and a long way down',
    sky: '#141d2e',
    block: '#4a5f8a',
    blockTop: '#8fa8dd',
    decor: 'clouds',
    decorColor: '#222f4a',
    glowColor: '#31406a'
  },
  monsterMountain: {
    id: 'monsterMountain',
    name: 'Monster Mountain',
    blurb: 'Everything at once. Good luck.',
    sky: '#1d1220',
    block: '#5c3160',
    blockTop: '#9b5aa6',
    decor: 'peaks',
    decorColor: '#2c1a30',
    glowColor: '#43264a'
  }
};

export const WORLD_THEMES = ['slimeLab', 'gluetown', 'cloudCastle', 'monsterMountain'];

export function themeFor(level) {
  return THEMES[level && level.theme] || THEMES.slimeLab;
}
