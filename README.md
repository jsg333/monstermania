# Monstermania 🟢🍄💥

A browser platformer designed by **Ethan (8)**. You have no powers of your own — every move comes from a monster standing in the level.

- **What to build:** `MONSTERMANIA-GAME-DESIGN.md`
- **How and in what order:** `BUILD-PLAN.md`
- **Status:** Phase 0 done ✅ · Phase 1 (the jump) in progress

## Running it

```bash
npm install     # first time only
npm run dev     # play it in your browser
npm test        # run the tests
npm run build   # build to dist/
```

## Controls

- **Move:** arrow keys or A / D
- **Jump:** *any* other button — spacebar, left click, right click, tap the screen
- **Hold the jump button longer to jump higher**

There's no coyote time and no jump buffer. That's Ethan's rule: *if you don't jump in time, you fall.*

## For Ethan — the file you get to mess with

**`src/data/config.js`** holds every number in the game: how fast you run, how high you jump, how strong Gogio's bounce is. Change a number, save the file, and the browser updates instantly.

Try these first:

| Change this | To see what happens |
|---|---|
| `JUMP_SPEED: 700` → `1000` | You jump way higher |
| `GRAVITY: 2200` → `1200` | Everything goes floaty, like the moon |
| `RUN_SPEED: 260` → `500` | You run super fast |
| `JUMP_CUTOFF: 0.38` → `1.0` | Tapping and holding do the same thing (worse!) |

**Change one number at a time**, then play it. That's how you learn what each one actually does. If you break something, set it back.

## For whoever builds the next phase

- All balance numbers live in `src/data/config.js`. Never hardcode a speed or a height anywhere else.
- `physics.js` and `collision.js` are pure functions — state in, state out. Keep them that way so they stay testable.
- `tests/physics.test.js` has a block called **"Ethan's rulings"** that locks in his design decisions. If a test in there fails, you've changed something that's his call, not yours. Go ask him.
- Collision substeps on purpose — Ickio launches the player fast enough to tunnel through tiles otherwise. Don't remove it.
