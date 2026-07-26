// MONSTERMANIA — every balance number lives here.
//
// Tuned by Ethan on 2026-07-25 with the tuning panel (?tune).
// He tried a fast snappy jump first, then went the other way and chose floaty:
// a 4.3-block jump that hangs in the air for 0.89s. Trying both extremes before
// picking is exactly how you should tune a game.
//
// Ethan: this is YOUR file. Change a number, save, and the game changes.
// Nothing else in the code is allowed to hardcode a speed or a jump height.
// Change ONE number at a time so you can feel what it did.

export const CONFIG = {
  // ---- How the world works ----
  GRAVITY: 1400,            // pixels per second, per second. Bigger = you fall faster.
  MAX_FALL_SPEED: 1400,     // you never fall faster than this
  TILE: 32,                 // how big one block is, in pixels

  // ---- Running ----
  RUN_SPEED: 250,           // top running speed
  GROUND_ACCEL: 2600,       // how fast you get up to speed on the ground
  GROUND_FRICTION: 3000,    // how fast you stop on the ground
  AIR_ACCEL: 1600,          // steering while you're in the air (less than on the ground)
  AIR_FRICTION: 400,        // you keep your speed better in the air
  BOOST_DECAY: 260,         // how fast a monster's throw fades back to normal running

  // ---- Jumping ----
  JUMP_SPEED: 620,          // how hard you launch upward
  JUMP_CUTOFF: 0.4,        // let go early and your jump gets cut to this much. Tap = little hop.

  // ---- ⚖️ ETHAN'S RULING: both of these are OFF. ----
  // "If you don't jump in time, you fall."
  // The code supports them so we can playtest with real kids someday.
  // Do NOT turn these on without Ethan.
  COYOTE_TIME_MS: 0,        // jump slightly after leaving a ledge. 0 = off. (typical game: 100)
  JUMP_BUFFER_MS: 0,        // remember a jump pressed just before landing. 0 = off. (typical: 120)

  // ---- Monsters ----
  FUNGY_HOP_SPEED: 520,     // Fungy's little forward hop
  FUNGY_FORWARD_BOOST: 240, // and the shove in the way you're running
  GOGIO_BOUNCE_SPEED: 1150, // Gogio's BIG bounce
  GOGIO_TIRED_STEP: 0.72,   // each bounce in a row is this much of the last one
  GOGIO_MAX_BOUNCES: 3,     // after this many he needs a breath
  GOGIO_RECOVER_MS: 1200,   // how long his breath takes
  SQUASH_MS: 220,           // how long the squash-and-stretch wobble lasts

  // ---- Dying ----
  RESPAWN_DELAY_MS: 400,    // must stay under 1000. Dying has to be FAST.
  HAZARD_FORGIVENESS: 7,    // pixels shaved off every spike. Bigger = kinder.

  // ---- Ethan's rule: land on TOP of a monster, or his spikes get you ----
  LANDING_BAND: 0.62,       // how much of a monster's height counts as "the top".
                            // Bigger = easier to land safely. Do not go below ~0.5.
  SPIKE_INSET: 6,           // pixels shaved off a monster's side spikes

  // ---- Camera ----
  CAMERA_DEADZONE: 70,      // how far you can drift from the middle before it follows
  CAMERA_EASE: 0.12,        // how smoothly it glides. 1 = snaps instantly.

  // ---- Boss: Big Gogio ----
  BOSS_HEALTH: 3,
  BOSS_WINDUP_MS: 500,      // he squishes before he jumps, so you get a fair warning
  BOSS_SPEEDUP_PER_HIT: 1.25,

  // ---- Ickio ----
  ICKIO_HOLE: 22,           // how wide the hole is. Bigger = easier to dive into.

  // ---- Goo Drops (coins you collect for character perks) ----
  GOO_SPIN_MS: 1400,        // how fast the coin spins
  GOO_PER_LEVEL: 3,
  GOO_PER_PART: 5,
  BONUS_LEVEL_AT: [15, 30, 45, 60]
};

export default CONFIG;
