# DEF-56: `cleanup --json` `lockReleased: false` cannot say "none held" from "release failed"

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | siegelense |
| Found | 2026-09-27, walkthrough case SL-031 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`cleanup --json` returns `"lockReleased": false`. It does not say whether no lock was held (normal) or a lock was held and could not be released (a failure). An agent cannot tell a clean run from a stuck boot lock.

Today the contract is `lockReleased: z.boolean()` (`cleanup-answer-contract.ts:43`). `lockReleaseLayerBroker` returns `{ lockReleased: boolean }` (`lock-release-layer-broker.ts:28`, `:57`) and a failed release throws, so `false` does mean none held today.

## What should happen

The JSON names the outcome in three states (for example a `lockReleaseOutcome` of released, none held, failed). For that, `lock-release-layer-broker` must return a failure instead of rethrowing.

## Where to look

- `packages/siegelense/src/contracts/cleanup-answer/cleanup-answer-contract.ts:43` (plus its test and stub)
- `packages/siegelense/src/brokers/cleanup/run/lock-release-layer-broker.ts:28-57` (the old ledger cited `:40-95`)
- `packages/siegelense/src/brokers/cleanup/run/cleanup-run-broker.ts:78`, `:91`
- `packages/siegelense/src/transformers/cleanup-answer-render/cleanup-answer-render-transformer.ts:36-40` (text view)

## History

Text view fixed in `9307bbe5e`, built: it prints `LOCK RELEASED: none held`. The JSON half waited on the contracts pivot, which merged 2026-09-30.
