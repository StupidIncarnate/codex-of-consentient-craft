# DEF-118: A `run` whose status is `failed` exits 0

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P1: a failed run exits 0, so a script reads failure as success |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-069 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`npm run siegelense -- run --instance inst_8591259dc557490183ee35dc08634557 --steps '[{"step":"waitFor","target":"[data-testid=\"NOPE\"]","state":"visible","timeoutMs":2000}]'` (run_7) reports `status: failed` but the command exits 0. A script or agent that checks the exit code reads a failed run as success.

## What should happen

**Decided by the user, 2026-09-30:** a run gets its own exit code.

| Exit | Meaning |
|---|---|
| 0 | The run executed and every step passed. A step marked `expect: error` that errors counts as a pass |
| 1 | siegelense refused or crashed: unknown instance id, bad `--steps`, unknown step. Unchanged |
| 2 | The run executed, and a step failed or timed out (`status: failed` or `status: timeout`) |

The `run` help and the walking and attacking docs state the three codes. Once this lands, re-run the held-back walkthrough cases SL-083 to SL-087; DEF-118 was the last thing they waited on.

## Where to look

The `run` entry and its answer in `packages/siegelense/src/flows/siegelense/` and `packages/siegelense/src/responders/siegelense/run/`; the help text in `siegelense-help-statics.ts`.

## History

DEF-117 (`waitFor` polls), DEF-120 and DEF-135 from the same group are fixed.
