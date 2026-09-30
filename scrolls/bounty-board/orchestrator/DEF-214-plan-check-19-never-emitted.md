# DEF-214: Plan validation check 19 ("a walk piece whose path needs a seeded system names a recipe") has no predicate

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | orchestrator |
| Found | 2026-09-30, walkthrough exploration; recorded in `scrolls/orcha-changes/HANDOFF.md` item 9 |
| Moved from | `scrolls/walkthrough/features/03-orchestrator-step-engine.md`, "Known open items"; 2026-09-30 |

## What is wrong

Check 19 is named in the contract but never emitted. Nothing in the repo can say whether a path "needs a seeded system"
(`work-plan-validation-check-statics.ts:7`, `work-plan-validate-transformer.ts:19,509-510`, `scrolls/orcha-changes/08-plan-validation.md:56`).
The consequence named there: a walker invents its own setup, differently each time.

## What should happen

The user decides: define what "needs a seeded system" means and emit the check, or remove check 19 from the contract.

## Where to look

- `packages/orchestrator/src/statics/work-plan-validation-check/work-plan-validation-check-statics.ts`
- `packages/orchestrator/src/transformers/work-plan-validate/work-plan-validate-transformer.ts`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
