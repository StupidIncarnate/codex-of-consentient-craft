# F116: hydration run-state map values are `z.custom<unknown>()`, which is `z.unknown()` renamed

| | |
|---|---|
| Status | needs decision |
| Package | hydration |
| Found | R1-T hydration |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts:25` holds its map values as a file-local `const resolvedRecordContract = z.custom<unknown>();`. That is `z.unknown()` under another name, and the pre-edit hook bans `z.unknown()`.

Also `hydration-recipes` `recipe-catalog-entry-contract.ts` has `inputs: zodSchemaContract` (`z.custom` with no type argument, so `unknown`; the same as `recipe-def-contract.ts`).

## What should happen

The user must decide the value type (in W8): `z.json()`, the recipe record contracts, or a named exception. Then add the pattern `z.custom<unknown>()` to the `z.unknown` ban.

## Where to look

`packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts:25`; `recipe-catalog-entry-contract.ts` and `recipe-def-contract.ts` in hydration-recipes; the hook's `z.unknown` ban.

## History

Found by R1-T hydration. Status in the EPIC was `open (W8)`.
