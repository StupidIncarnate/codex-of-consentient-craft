# DEF-59: `recipes` does not list input meanings or returned fields, so an agent cannot chain seeds

| | |
|---|---|
| Status | ready |
| Package | cross-cutting |
| Found | 2026-09-27, walkthrough case SL-036 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`siegelense recipes` does not tell an agent enough to chain seeds, even after it has read `docs --for walking`.

(1) No recipe lists the fields its `as` handle exposes to later steps (`guildId`, `guildSlug`, `guildPath`, `questId`, and so on).
(2) Inputs are bare key names with no meaning or source: `guildId`, `guildPath` and `guild` are used for one concept, and nothing says which field fills `guildPath`.

The listing comes from the `recipe()` framework: description is hand-written, `inputs` are schema keys, `runs` and `makes` come from the plan (`packages/hydration/CLAUDE.md`).

## What should happen

Bring input meanings and returned fields into `recipe()` and render them in `recipes` (text and `--json`).

- Input meanings: zod `.describe()` on each input, surfaced as `inputMeanings` on the catalog and listing entries.
- A `returns` map on the recipe definition, threaded through the declare broker, the `probeListing()` bodies and the renderer.

## Where to look

Likely touches `packages/hydration`, `packages/hydration-recipes` and `packages/siegelense`. The adapters are gone, so the old paths are stale. Original paths from the ledger (find their current homes with `discover`): `recipe-catalog-entry-contract.ts:38-42`, `recipe-listing-entry-contract.ts:43-51`, `recipe-def-contract.ts:24-28`, `recipe-declare-broker.ts:56-71`, the nine `probeListing()` bodies in `recipes-catalog-broker.ts:44-298`, and the renderer `recipes-answer-render-transformer.ts:34-54`.

Could not confirm on 2026-09-30: a `discover` for `returns`, `parameters` and `describe(` in `packages/hydration*/src/contracts/recipe-*/` found nothing, so the work is not done there; the files may have moved.

## History

`71742a8e2`, built: the old recipe book (`recipe-book-statics.ts`) is retired and its two entries' prose moved into those recipes' headers. `recipe-maker` step 3 names the fields the listing really has.

Item (3) of the original report (`makes` says `quest (varies)` where the description says three quests) is by design: `(varies)` is what the framework reports when a filter reaches rows the plan created (`plan-makes-transformer.test.ts:156-179`). The text view drops the exact `makes` counts the JSON has (`quest ×3` becomes `quest (varies)`).
