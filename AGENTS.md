# AGENTS.md — Monstermania

Shared source of truth for any AI assistant working in this folder (Claude, Codex, etc.). Equals — no special roles; `CLAUDE.md` points here.

## What this is

**Monstermania** — a browser platformer designed by Ethan (8) and built with AI assistants. You have no powers of your own; every move comes from a monster in the level. Dive into Ickio's hole to finish each level.

- **Game content source of truth:** `MONSTERMANIA-GAME-DESIGN.md` (wins any conflict)
- **Execution order:** `BUILD-PLAN.md` (phases; do them in order, one phase per PR series)
- **Status:** Phase 0 scaffold done ✅ — Vite + Vitest, running/jumping test room, 23 tests green. Phase 1 is tuning the jump until Ethan says it feels right.
- **Phasing:** make World 1 fun first. The level maker is **Phase 9** — do not build it early.
- **Repo:** https://github.com/jsg333/monstermania (`main`) · **Live:** https://monstermania.pages.dev

## Deploying

**Automatic.** Cloudflare Pages project `monstermania` is connected to this repo — every push to `main` builds and deploys. No manual step. `npm run deploy:cloudflare` still exists as an escape hatch.

Build settings (already configured): framework preset **None**, build command `npm run build`, output directory `dist`, production branch `main`, env var `NODE_VERSION=20`.

Two gotchas worth remembering:

- Cloudflare **cannot** add Git integration to an existing Pages project. If this project ever gets recreated, it must be made via **Create application → Pages → Import an existing Git repository** from the start. The dashboard's "Create application" button now funnels into the *Workers* wizard — go straight to `/workers-and-pages/create/pages` to get the Pages flow.
- If a build fails with `vite: command not found`, the builder is omitting devDependencies — set `NODE_ENV=development`.

## Open design questions (Ethan answers these, not the assistant)

Tracked under **Still to decide** at the bottom of the design doc. Ask him **one question at a time, always with a recommendation** — that's how he asked to work.

Settled already: see **Ethan's Rulings** in the design doc. Those beat everything else, including assistant recommendations. Notably: no coyote time, no jump buffer (build both as switches in `src/data/`, default OFF, revisit only after a real playtest), and the player dies and restarts at a checkpoint.

## Conventions

- Age-appropriate content — the designer and the players are kids.
- Write for Ethan: plain language, short sentences, tables over paragraphs. Explain *why* a design change was made, not just what changed.
- Challenge weak ideas honestly, but always keep his originals intact or explain the trade.
- Stack: vanilla JS + Canvas, Vite, Vitest. No frameworks. Same as Farmland.
- All balance numbers (jump height, bounce power, timers) live in `src/data/config.js` only, so Ethan can tune the fun parts.
- `physics.js` and `collision.js` are pure functions — keep them that way so they stay unit-testable.
- `tests/physics.test.js` has an **"Ethan's rulings"** block that asserts his design decisions in code. A failure there means you changed something that is his call. Ask him; do not "fix" the test.
- Collision substeps deliberately (Ickio-speed movement tunnels through tiles otherwise). Do not remove it.

## Memory

Read `MEMORY.md` at session start if present. User-triggered writes only; persistent; flag contradictions rather than overwriting.
