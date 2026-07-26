# MEMORY.md — Monstermania

Shared state between sessions and between agents (Claude, Codex). Read this at session start. Writes are user-triggered only. Persistent — entries stay until Jeff asks to change or remove them. Flag contradictions rather than overwriting.

---

## Where the project stands — 2026-07-26

**Live and playable end to end.** `main` is clean, nothing uncommitted, 280 tests green across 19 files, build passes.

| Phase | State |
|---|---|
| 0 Scaffold | ✅ done |
| 1 The jump | ✅ done |
| 2 Platforms, death, checkpoints | ✅ done |
| 3 Fungy and Gogio | ✅ done |
| 4 Ickio | ✅ done |
| 5 World 1 (6 levels) + Big Gogio | ✅ done |
| 6 Monster Maker + Goo Drops + sound | ✅ done |
| 7 Worlds 2–4 (Stickio, Slowmo) | ⬜ **not started — the main open work** |
| 8 Polish (art, music, particles, title screen) | ⬜ not started |
| 9 The Level Maker | ✅ **done early, out of order** |

**Why Phase 9 jumped the queue:** Ethan's answer to "what's missing?" in his World 1 playtest was *"the ability to create new levels"* — the same thing he asked for on day one. The plan said not before Phase 8; he outranks the plan.

Also shipped after Phase 9: the whole game works on an iPad (drawn touch pads, per-finger tracking, a real name input for the iOS keyboard).

## What Ethan has ruled on (from his World 1 playtest)

| Question | His answer | Consequence |
|---|---|---|
| Does dying feel annoying or funny? | "Funny" | No coyote time, no jump buffer. Settled. |
| Is 1-3 (the tower) too hard? | "No" | Leave it. |
| Is Big Gogio fun? | "Difficult, but once you've beat it, it feels really good" | Don't touch him. |
| Best / worst level? | Best 1-4, worst 1-2 — *"in 1-2 the Fungy doesn't have any purpose"* | Fixed: the only route out of the canyon is now a Fungy throw. |
| What's missing? | "The ability to create new levels" | Became Phase 9, now built. |

Full rulings list lives in `MONSTERMANIA-GAME-DESIGN.md` → **Ethan's Rulings**.

## Still waiting on Ethan

- Names for the four theme packs
- How many character parts to start with
- What the Monstermania music sounds like
- Has he played the Level Maker yet? No feedback captured on it — that's the next thing to find out before building more.

One question at a time, always with a recommendation.

## Next session — likely starting points

1. **Get Level Maker feedback from Ethan.** It's built but unplaytested. Building Phase 7 on top of an untested toolbox repeats the 1-2 mistake at a bigger scale.
2. **Phase 7 — World 2 (Stickio):** stick to him, walk on walls and ceilings. Moving platforms, Walking Grumps. Then World 3 (Slowmo), then World 4 (everything combined, no new monsters). One boss per world.
3. `README.md` was stale about project status and about four numbers in the "For Ethan" tuning table; corrected 2026-07-26 to match `src/data/config.js`. If those numbers change again, that table needs changing too.

## Definition of done, every phase

1. `npm test` passes  2. `npm run build` passes  3. Ethan has played it  4. The design doc is updated if anything changed
