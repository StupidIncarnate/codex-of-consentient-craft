# DEF-232: the four gateway folder names are still hand-kept in every workspace package.json imports field

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Priority | P3: hand-kept copies that agree today |
| Package | gateway |
| Found | 2026-09, `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history) item 5 |
| Moved from | `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), 2026-09-30 |

## What is wrong

Adding or renaming a gateway folder (`npm`, `node`, `browser`, `bin`) means finding every copy by hand, and nothing checks that the copies agree.

Partly fixed. `gatewayLocationsStatics.folders` (`packages/shared/src/statics/gateway-locations/gateway-locations-statics.ts:30-34`) is now the one list. `packageGlobs` derives from it (`:36`). `gatewayFoldersStatics` and `gatewaySourceCopyStatics` in `cli` read from it. Still to confirm: the `imports` field of every workspace `package.json` still names the folders as plain text, with no check against the statics.

## What should happen

A check (test or lint) that every workspace `package.json` `imports` field agrees with `gatewayLocationsStatics.folders`, or generation of the field from it. If the `imports` copies turn out to be generated already, delete this file.

## Where to look

- `packages/shared/src/statics/gateway-locations/gateway-locations-statics.ts`
- `packages/cli/src/statics/gateway-folders/`, `gateway-source-copy/`
- each workspace `package.json` `imports`

## History

Original text: `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), item 5.
