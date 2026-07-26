# MONSTERMANIA — Build Plan

Execution plan for AI assistants (Claude, Codex, etc.). Source of truth for *what* to build is `MONSTERMANIA-GAME-DESIGN.md`; this doc is *how* and *in what order*.

## Ground rules

- **Stack:** Vanilla JS + HTML5 Canvas, Vite for dev/build, Vitest for tests. No frameworks. Build output → `dist/`.
- **Hosting:** Cloudflare Pages (framework preset: None, build `npm run build`, output `dist/`), same as Farmland.
- **Workflow:** Keep `main` green and deployable. One phase = one or more short-lived branches → PR → squash-merge when `npm test` and `npm run build` pass. No direct pushes to `main`.
- **Scope discipline:** Build phases in order. Do not start phase N+1 in a PR for phase N. If a phase reveals a design question, ask Ethan — **one question at a time, with a recommendation** — rather than inventing an answer.
- **Audience:** The designer and the players are 8. Readable fonts, no reading-heavy tutorials, age-appropriate everything.
- **Art:** Start with colored shapes. Ickio is a lime-green blob with a visible black hole; Gogio is a big round bouncer; Fungy is a mushroom. Swap in real art during the polish phase. **Never block a phase on art.**

## The rule that matters most

> **Phase 1 is the whole game.** If running and jumping don't feel good with nothing else on screen, no amount of monsters, themes or bonus levels will save it. Do not move past Phase 1 until Ethan plays it and says the jump feels right.

## Architecture (establish in Phase 0, keep stable)

```
src/
  main.js            # boot, game loop (requestAnimationFrame), scene switching
  state.js           # one serializable game-state object
  scenes/            # play.js, title.js, monsterMaker.js, levelSelect.js
  systems/           # input.js, physics.js, collision.js, save.js, sound.js
  entities/          # player.js, ickio.js, gogio.js, fungy.js, stickio.js, slowmo.js, grump.js
  data/              # config.js (ALL balance numbers), levels/ (level layouts), parts.js
  render/            # sprites.js, ui.js, particles.js
tests/               # vitest unit tests for systems + data
```

- Game state is a single serializable object (`state.js`) — makes saving and testing easy.
- **All balance numbers live in `src/data/config.js`.** Never hardcode a speed, a jump height or a bounce power in logic. Ethan tunes the fun by editing one file.
- Physics and collision are **pure functions** — given state in, new state out. That's what makes them unit-testable without a browser.

## ⚖️ Ethan's rulings that constrain the code

| Ruling | What the code must do |
|---|---|
| No coyote time | `COYOTE_TIME_MS: 0` in config. Logic supports it; it's switched off. |
| No jump buffer | `JUMP_BUFFER_MS: 0` in config. Same. |
| You die and restart at a checkpoint | Instant respawn (< 1s). **No lives, no game-over screen, ever.** |
| One-button game | Any key except movement jumps. Also mouse and touch. |
| Ickio keeps your speed | The teleport must preserve the velocity vector. This is not optional — it's the whole game. |
| Easy start, hard finish | World 1 levels get wide ledges and frequent checkpoints. |

**On the two switches:** they exist so we can playtest both ways, not so we can quietly overrule Ethan. Default OFF. Only revisit after real kids have played it, and only with Ethan in the room.

---

## Phase 0 — Scaffold ✅ DONE

1. Vite + Vitest project, `src/` skeleton above, `AGENTS.md` + `CLAUDE.md`.
2. Game loop rendering a canvas with an FPS counter.
3. `src/data/config.js` with every balance number from the design doc.
4. CI: GitHub Actions running `npm test` + `npm run build` on PRs.

**Done when:** `npm run dev` shows a canvas; `npm test` and `npm run build` pass.

## Phase 1 — The jump ✅ DONE

1. Player entity: run left/right with acceleration and friction, gravity, ground collision.
2. **Variable-height jump** — tap for a hop, hold for a full jump.
3. One-button input: arrows/A-D to move, *any* other key to jump; mouse and touch too.
4. A single flat test room with a few platforms. No monsters, no hazards, no goal.
5. Unit tests for the physics step and the jump-height curve.

**Done.** Ethan tuned it himself with the tuning panel (`?tune`) on 2026-07-25. He tried a fast snappy jump first, then chose floaty: **4.29 blocks high, 0.89s in the air, a 0.69-block tap hop, and a 6.9-block gap at a full run.**

That last number is a design constraint now — no pit in any level may be wider than about 6 blocks unless a monster is there to help you across.

He also caught a real bug by feel: jumps were being dropped because a key press lands between animation frames. Tests alone never noticed.

## Phase 2 — Platforms, death and checkpoints ✅ DONE

1. Tile-based level format (a 2D array in `src/data/levels/`) with solid platforms.
2. Camera that follows the player.
3. Stuck Grumps (static spikes) + pit deaths → puff of smoke → instant respawn at last checkpoint.
4. Snoozers (checkpoint monsters) — touch to activate, visibly wake up.

**Done.** Levels are drawn as text (`1` solid, `^` Grump, `S` Snoozer, `P` start) so Ethan can build one in any text editor. Camera follows with a dead zone and never shows outside the level. Respawn is 400ms with no screen to click through.

Spike hitboxes are shaved 7px on every side (`HAZARD_FORGIVENESS`). Nothing makes a player quit faster than dying to a spike they were sure they cleared.

**Still needs Ethan's verdict:** die twenty times on purpose and check it never feels annoying.

## Phase 3 — Fungy and Gogio ✅ DONE

1. **Fungy:** low forward hop in the direction you're moving. Never tires. Infinite use.
2. **Gogio:** big straight-up bounce. Squishes flatter on each of 3 consecutive bounces, then recovers after a pause.
3. Squash-and-stretch animation on both — this is where the game starts feeling alive.

**Done.** Fungy skips you forward and never tires; Gogio launches you straight up and flattens with each bounce in a row. Both squash and stretch.

Ethan then added three rulings during playtesting:
- monsters look scarier (spikes, glaring eyes, jagged grins)
- **you must land on TOP or the side spikes get you** — `LANDING_BAND` keeps the top forgiving
- the reward on the high shelf is a **Goo Drop** (a coin for character perks), not a checkpoint

Three bugs surfaced here that pure-function tests could not see: monsters on the ground were unbounceable, levels never reset between plays, and running clamped away Fungy's forward throw. See `tests/integration.test.js`.

## Phase 4 — Ickio ⭐

1. Linked Ickio pairs (matched by color id) placed in the level data.
2. Enter by touching the hole — no button press.
3. **Momentum preserved through the teleport.** Fall fast in, launch fast out. Test this with numbers, not vibes.
4. Big Ickio = the level exit. Level-complete screen.

**Done when:** dropping into an Ickio from a great height visibly launches you further than walking into one. Unit test asserting speed-in equals speed-out.

## Phase 5 — World 1 (6 levels) + Big Gogio

1. Build levels 1-1 through 1-5 following **Teach → Test → Twist** from the design doc. 30–90 seconds each.
2. Boss 1-6: Big Gogio bounces around; land on his head 3 times; he speeds up as health drops; **half-second squish wind-up before every jump** so it's readable.
3. Health bar UI, boss defeat animation.
4. Level-select screen.

**Done when:** a kid who has never seen the game can finish World 1 without help. Go find one and watch them play — don't guess.

## Phase 6 — Monster Maker + Goo Drops

1. Character creator: type a name, pick body / color / eyes / mouth / hat. Recommended starting set: 4 / 8 / 4 / 4 / 6.
2. Goo Drops: 3 hidden per level, "2 / 3" counter, saved per level.
3. Unlocks: new parts every few drops; **secret bonus levels at 15 / 30 / 45 / 60**.
4. `save.js` — persist everything to `localStorage`.

**Done when:** you can make a character, collect drops, unlock a hat, reload the page, and it's all still there.

## Phase 7 — Worlds 2–4

- **World 2 — Stickio:** stick to him, walk on walls and ceilings. Moving platforms, Walking Grumps.
- **World 3 — Slowmo:** slime cloud, float down slowly. Ceiling Grumps, Sleepy Ickios that open and close.
- **World 4:** no new monsters. Everything combined, hard.
- One boss per world.

**Done when:** difficulty rises smoothly world to world. Play them in order and check no level is harder than the one after it.

## Phase 8 — Polish

Real art, music and sound, particles, screen shake on the boss, title screen, bonus levels, the golden character part.

## Phase 9 — The Level Maker (Ethan's editor)

**Not before Phase 8.** Tabs: 🟢 Monsters · ⚠️ Hazards · 🧱 Platforms · 🎨 Themes. Plus a Play button that drops you straight into your level and returns you to the same edit spot, and a short share code friends can type in.

The reason this is last: there's no point letting kids build levels out of pieces that don't feel good yet. Make the pieces great, *then* hand over the toolbox.

---

## Definition of done for every phase

1. `npm test` passes
2. `npm run build` passes
3. Ethan has played it
4. The design doc is updated if anything changed
