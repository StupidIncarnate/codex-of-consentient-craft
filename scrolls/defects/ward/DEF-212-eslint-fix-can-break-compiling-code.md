# DEF-212: Ward's `eslint --fix` sometimes turns compiling code into code that fails to compile

| | |
|---|---|
| Status | suspected |
| Package | ward |
| Found | 2026-09-30, walkthrough case WD-46 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "WD-46", and `scrolls/walkthrough/features/07-ward.md`, "Known open items"; 2026-09-30 |

## What is wrong

Intermittent. `scrolls/workflow-paralellizer-plan.md` section 9.16 traces it upstream to `@typescript-eslint`. One deliberate before/after check found no recurrence across
17 legitimate `as unknown` hits. No guard exists; a full-repo memory-ceiling test that used to run was removed as measuring nothing durable.

## What should happen

A way to detect a fix that broke compilation (for example a typecheck after the fix pass), or confirm it is gone and delete this file.

## Where to look

- `scrolls/workflow-paralellizer-plan.md` section 9.16
- ward lint runner in `packages/ward`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
