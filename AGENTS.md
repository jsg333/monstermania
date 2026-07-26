# AGENTS.md — Monstermania

Shared source of truth for any AI assistant working in this folder (Claude, Codex, etc.). Equals — no special roles. `CLAUDE.md` points here. Update this file when what it says stops being true.

## What this is

**Monstermania** — a browser platformer designed by Ethan (8) and built with AI assistants. You have no powers of your own; every move comes from a monster in the level. Dive into Ickio's hole to finish each level.

- **Repo:** https://github.com/jsg333/monstermania (`main`) · **Live:** https://monstermania.pages.dev
- **What to build:** `MONSTERMANIA-GAME-DESIGN.md` — game content wins any conflict
- **In what order:** `BUILD-PLAN.md` — phases, done in order
- **Where we are right now:** `MEMORY.md` — read it first, it's the handoff between sessions and between agents
- **Playtest notes from Ethan:** `PLAYTEST.md`

Success = Ethan thinks it's fun and can build his own levels in it. Not test coverage, not feature count.

## Stack and commands

Vanilla JS + Canvas, Vite, Vitest. No frameworks, no TypeScript, no build-time magic beyond Vite.

```bash
npm install     # first time
npm run dev     # play it locally
npm test        # vitest run — 280 tests, all green as of 2026-07-26
npm run build   # → dist/
```

CI (`.github/workflows/ci.yml`) runs `npm test` and `npm run build` on Node 22 for every push and PR to `main`.

## Where things live

| Path | What's in it |
|---|---|
| `src/data/config.js` | **Every balance number.** Nothing else may hardcode a speed or a height. |
| `src/data/levels/` | `world1.js`, `playground.js`, and `format.js` (the ASCII level parser) |
| `src/data/parts.js`, `themes.js` | Character parts, theme packs |
| `src/systems/` | `physics`, `collision`, `camera`, `input`, `ickio`, `bouncers`, `hazards`, `boss`, `sound`, `save`, `solver` |
| `src/scenes/` | `play`, `levelSelect`, `monsterMaker`, `editor` (the Level Maker) |
| `src/render/` | `sprites`, `backdrop`, `ui`, `uiButtons`, `editorDraw`, `tuner` |
| `src/main.js` | Scene switching, the game loop, and the `window.__mm` test hook |
| `tests/` | 19 vitest files, `tests/physics.test.js` holds the "Ethan's rulings" block |

## Working on it in a browser

- `?level=1-3` — jump straight into a level · `?playground` — the sandbox level · `?tune` — live tuning sliders (`src/render/tuner.js`)
- `window.__mm` exposes live state: `step(n)`, `setInput()`, `press()/release()`, `goTo(id)`, `place(x,y)`, `openEditor()`, `game`, `scene`, `sel`, `maker`, `editor`, `fps`, `build`, `lastError`.
- **Use `__mm` instead of reading canvas pixels.** Browsers throttle rAF to zero in a hidden tab, so a healthy game looks frozen — `step()` sidesteps that entirely.
- The build stamp is drawn on screen (bottom-right of the level select). Before believing any playtest report, check it — "is he even running my fix?" has cost real time here.

## Conventions

- **Age-appropriate content.** The designer and the players are kids.
- **Write for Ethan:** plain language, short sentences, tables over paragraphs. Explain *why* a change was made, not just what changed.
- Challenge weak ideas honestly, but keep his originals intact or explain the trade.
- All balance numbers go in `src/data/config.js` so Ethan can tune the fun parts himself.
- `physics.js` and `collision.js` are pure functions — state in, state out. Keep them that way.
- Commit messages here are prose that explains the reasoning, not one-liners. Match the existing style.

## Constraints and gotchas

- **Jump feel is Ethan-tuned and settled.** Do not change `GRAVITY` / `JUMP_SPEED` / `RUN_SPEED` / `JUMP_CUTOFF` without him. He tried snappy, then chose floaty: a 4.3-block jump that hangs 0.89s.
- **`tests/physics.test.js` → "Ethan's rulings"** asserts his design decisions in code. A failure there means you changed something that is his call. Ask him; do not "fix" the test.
- **No coyote time, no jump buffer.** Built as switches in `src/data/config.js`, default 0 (off). Ethan's ruling, and it survived twenty deaths in a real playtest. Leave them off.
- **Collision substeps deliberately.** Ickio-speed movement tunnels through tiles otherwise. Do not remove it.
- **Level reachability is checked, not assumed.** `src/systems/solver.js` derives its jump budget from `config.js` and deliberately *under*-estimates the player (currently 4 blocks up, 5 across, vs. a true ~6.9-block running gap). A level it passes is definitely beatable; a false alarm is cheap, an impossible level is not. The Level Maker runs it live while Ethan builds.
- **Gogios need clear sky directly above them.** Landing on one throws you straight up into whatever's there.
- **A level that teaches a monster must make that monster necessary.** Ethan's sharpest note: 1-2 was named *Meet Fungy* and Fungy was decoration. If there's an ordinary-jump route around your teaching moment, the lesson doesn't land.
- **iOS/iPad rules that already bit us once each:** `touch-action` is not inherited — set it on the canvas, not `<body>`. `focus()` must run synchronously inside the tap handler. iOS won't raise the keyboard for an off-screen or `opacity: 0` input, so the Monster Maker name box is a real visible `<input>` over the canvas. Touch controls are drawn, finger-sized pads tracked per-finger — invisible screen zones an 8-year-old has to guess at were a bad idea regardless.
- **`node_modules/` here is macOS-native.** Running `npm test` from a Linux sandbox fails on rollup's native binary. Install fresh in the sandbox rather than reusing it.
- **If `vite: command not found`:** the shell or builder has `NODE_ENV=production` and is skipping devDependencies. `NODE_ENV=development npm install --include=dev`.

## Deploying

**Automatic.** Cloudflare Pages project `monstermania` is connected to this repo — every push to `main` builds and deploys in about a minute. `npm run deploy:cloudflare` exists as an escape hatch.

Build settings (already configured): framework preset **None**, build command `npm run build`, output directory `dist`, production branch `main`, env `NODE_VERSION=20`.

Two things worth remembering if it ever gets rebuilt:

- Cloudflare **cannot** add Git integration to an existing Pages project. It must be created via **Create application → Pages → Import an existing Git repository** from the start.
- The dashboard's "Create application" button funnels into the *Workers* wizard. Go straight to `/workers-and-pages/create/pages`.

## Asking Ethan things

Open questions are tracked under **Still to decide** at the bottom of the design doc. Ask him **one question at a time, always with a recommendation** — that's how he asked to work.

**Ethan's Rulings** in the design doc beat everything else, including assistant recommendations and anything written here.

## Memory

`MEMORY.md` is the shared state file — either agent reads it at session start and picks up where the other stopped. Writes are user-triggered only ("remember this", "log this", "save this"), entries are persistent, and a contradiction gets flagged rather than silently overwritten.
