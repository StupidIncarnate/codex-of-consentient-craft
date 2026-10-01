# F116: hydration run-state map values are `z.custom<unknown>()`, which is `z.unknown()` renamed

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | hydration |
| Found | R1-T hydration |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts:25` holds its map values as a file-local `const resolvedRecordContract = z.custom<unknown>();`. That is `z.unknown()` under another name, and the pre-edit hook bans `z.unknown()`.

Also `hydration-recipes` `recipe-catalog-entry-contract.ts` has `inputs: zodSchemaContract` (`z.custom` with no type argument, so `unknown`; the same as `recipe-def-contract.ts`).

## What should happen

**Decided by the user, 2026-09-30: give them real types and close the loophole.**

1. Type `hydration-run-state-contract.ts`'s map values properly, with `z.json()` or the recipe record contracts, whichever matches the data actually stored. Do the same for `inputs: zodSchemaContract` in `recipe-catalog-entry-contract.ts` and `recipe-def-contract.ts` (hydration-recipes).
2. Extend the `z.unknown` ban (the pre-edit hook, and the lint rule if one carries it) so `z.custom<unknown>()` and a bare `z.custom()` are caught too. Scan the repo for other uses and fix them in the same pass.

## Where to look

`packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts:25`; `recipe-catalog-entry-contract.ts` and `recipe-def-contract.ts` in hydration-recipes; the hook's `z.unknown` ban.

## History

Found by R1-T hydration. Status in the EPIC was `open (W8)`.
