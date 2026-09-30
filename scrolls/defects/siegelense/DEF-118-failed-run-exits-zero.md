# DEF-118: A `run` whose status is `failed` exits 0

| | |
|---|---|
| Status | needs decision |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-069 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`npm run siegelense -- run --instance inst_8591259dc557490183ee35dc08634557 --steps '[{"step":"waitFor","target":"[data-testid=\"NOPE\"]","state":"visible","timeoutMs":2000}]'` (run_7) reports `status: failed` but the command exits 0. A script or agent that checks the exit code reads a failed run as success.

## What should happen

Choose one. Either a run whose status is `failed` exits non-zero, or the help states plainly that exit 0 means "the batch was delivered" and names where the verdict is. Is exit 0 on a failed run intended? (Fix order 7 in the SL-069 group.) Held-back cases SL-083 to SL-087 wait on this, DEF-117, DEF-120 and DEF-135.

## Where to look

The `run` entry and its answer in `packages/siegelense/src/flows/siegelense/` and `packages/siegelense/src/responders/siegelense/run/`; the help text in `siegelense-help-statics.ts`.

## History

DEF-117 (`waitFor` polls), DEF-120 and DEF-135 from the same group are fixed.
