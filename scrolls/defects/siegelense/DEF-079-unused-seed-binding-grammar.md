# DEF-79: Unused placeholder code from an older two-segment reference grammar

| | |
|---|---|
| Status | suspected |
| Package | siegelense |
| Found | 2026-09-27, walkthrough cases SL-079, SL-004, SL-005 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

The DEF-79 agent found code for an older two-segment reference grammar that nothing uses. On 2026-09-30 these still exist:

- `packages/siegelense/src/transformers/step-interpolate/step-interpolate-transformer.ts`
- `packages/siegelense/src/statics/seed-placeholder/seed-placeholder-statics.ts`
- `packages/siegelense/src/errors/seed-binding-unknown/seed-binding-unknown-error.ts`
- `packages/siegelense/src/contracts/seed-bindings/`

A `discover` for `stepInterpolateTransformer` hits only its own files and a comment in `seed-result-render-transformer.ts:12`. No broker imports it. Current bindings use three segments (`{g.guild.id}`). Could not confirm that nothing reaches it through a dynamic path.

## What should happen

Confirm nothing imports them, then delete the files with their tests and stubs. If something does use them, change the status and the note.

## Where to look

The four paths above, plus `packages/siegelense/src/transformers/seed-result-render/seed-result-render-transformer.ts:12`.

## History

Named as a cleanup candidate after the pivot. DEF-79 itself (ten copy-paste failures on the role pages) is fixed: `7297cbd8a`, built 2026-09-27.
