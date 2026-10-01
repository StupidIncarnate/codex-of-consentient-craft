# DEF-83: The `until` refusal is filed under `steps.0.visible` when no `visible` was given

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P3: a refusal names the wrong field path |
| Package | siegelense |
| Found | 2026-09-28, walkthrough cases SL-069, SL-072 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

The `until` refusal is filed under `steps.0.visible` even when no `visible` was given. SL-072 (2026-09-28) shows the same pattern: `click` with no handle is filed under `steps.0.target`.

`step-contract.ts:557` still has `path: ['visible']`.

## What should happen

File the refusal under `steps.0`: `path: []`.

## Where to look

`packages/siegelense/src/contracts/step/step-contract.ts:557` (the old ledger cited `:391`), and the `click` handle refusal in the same file.

## History

Items 1 and 3 of DEF-83 fixed in `e062a1690`, built: `hold` returns `reading`, and `dom` on no match gives `note: "no element matched target ..."`.
