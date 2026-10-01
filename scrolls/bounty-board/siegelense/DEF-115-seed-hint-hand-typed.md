# DEF-115: The seed refusal hint still hand-types the providing recipe and binding paths

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P3: a hint is hand-typed |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-059 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`npm run siegelense -- start --spec stack --seed quest-advances-one-step` refuses correctly. The hint is now one `--steps` array in run order, but the providing recipe (`guild-empty`), the input name and the binding path (`{g.guild.id}`) are still hand-typed. Same hint for SL-060 to SL-062's recipes.

## What should happen

The user's condition: nothing in the hint is hand-typed. The providing recipe, the input name and the binding path come from the recipe catalog (see the audit in DEF-103). Expected text: `[{"step":"seed","recipe":"guild-empty","as":"g"},{"step":"seed","recipe":"quest-advances-one-step","params":{"guildId":"{g.guild.id}"}}]`. A binding like `{g.guild.id}` lasts one batch, so it must be one array.

## Where to look

- `recipe-listing-entry-contract.ts` (find with `discover`; it needs a field saying which recipe provides an input) and the hydration side that fills it
- the hint builder in `packages/siegelense/src/` (search for `add a run seed step`). Depends on DEF-59, which adds input meanings to the recipe definitions.

## History

`0f37b2f39`, merge `1428407a8`: one `--steps` array in run order.
