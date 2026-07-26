# Level 1-2: gentler Fungy jump

## Goal

Make the required Fungy jump in **Meet Fungy** easier for a second level,
without making Fungy optional or changing Ethan's settled player movement.

## Change

Move the far edge of the chasm two tiles closer to Fungy. The chasm will still
be wider than a normal running jump, so Fungy remains the only route out.

## Guardrails

- Do not change movement or bouncer values in `src/data/config.js`.
- Keep the Fungy on the near side of the chasm.
- Keep the level unwinnable when Fungy is removed.
- Assert the new, smaller chasm width in the level-layout tests.

## Verification

Run the focused layout and reachability tests, then the complete test suite and
production build.
