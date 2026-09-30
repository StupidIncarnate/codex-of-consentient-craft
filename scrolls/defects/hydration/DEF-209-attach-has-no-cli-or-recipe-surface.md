# DEF-209: The `attach` hydration verb is reachable only from a Jest test

| | |
|---|---|
| Status | suspected |
| Package | hydration |
| Found | 2026-09-30, walkthrough case HY-23 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "HY · `attach`", and `scrolls/walkthrough/features/02-hydration-and-recipes.md`, "Known open items"; 2026-09-30 |

## What is wrong

`attach` is built and integration-tested (`15fec3a61`, `quest-ingredient-broker.integration.test.ts`), but no recipe in the catalog calls it and the CLI has no verb for it.
The ledger row calls this a gap, not a bug. `packages/hydration/CLAUDE.md` documents a real TypeScript limitation (`TS18048`) when chaining a child
accessor off an attached row.

## What should happen

The user decides: add a recipe that uses `attach`, or accept it as library-only. If library-only, delete this file.

## Where to look

- `packages/hydration` (`attach`)
- `packages/hydration-recipes` (catalog)

## History

HY-23 is the only way to see it work today.
