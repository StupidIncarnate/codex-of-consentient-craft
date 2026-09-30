# DEF-233: ward slow-test gate flags the cli install integration test under full-suite load

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Package | cli |
| Found | 2026-09-26, full `npm run ward` |
| Moved from | `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history) item 39, 2026-09-30 |

## What is wrong

A full `npm run ward` on 2026-09-26 passed every check, then failed the slow-test gate on `packages/cli/src/startup/start-install.integration.test.ts`: slowest test 10.7s against the 10s bar (`slowFileThresholdStatics.threshold.integrationTestWarnMs`, `packages/ward/src/statics/slow-file-threshold/slow-file-threshold-statics.ts:28`). Alone, the same file's slowest test takes 2.4s. The gateway source copy `init` runs takes 50ms for 408 files, so the time is load, not the copy.

The bar is still 10_000 and its comment notes contended multi-installer suites clear in 8-9s. Not re-measured after 2026-09-26. A bare `npm run ward` is not green while this stands.

## What should happen

Find which of the file's six tests hits 10s under load and why. Then choose: make it cheaper, or raise the bar. Run a full ward first; if the gate passes now, delete this file.

## Where to look

- `packages/cli/src/startup/start-install.integration.test.ts`
- `packages/ward/src/statics/slow-file-threshold/slow-file-threshold-statics.ts`

## History

Original text: `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), item 39.
