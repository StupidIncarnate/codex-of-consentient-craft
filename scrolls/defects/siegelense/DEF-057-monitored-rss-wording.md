# DEF-57: `MONITORED: rss per process group` still uses jargon

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-27, walkthrough case SL-032 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

The `status` output line `MONITORED: rss per process group` still uses the word `rss`. The metric name comes from `machineStatics.monitored` (`machine-statics.ts:17`, value `'rss per process group'`), the type derives from it in `monitored-metric-contract.ts`, and the test stub pins the old value (`status-answer.stub.ts`, `machine-statics.test.ts:6`).

## What should happen

The user wants plain wording, such as `memory per process group`, that matches the `MEMORY` column. The help says what it holds.

## Where to look

- `packages/siegelense/src/statics/machine/machine-statics.ts:9`, `:17`
- `packages/siegelense/src/contracts/monitored-metric/monitored-metric-contract.ts`
- `packages/siegelense/src/contracts/status-answer/status-answer.stub.ts` (pins the old value)
- the status render and help that print the `MONITORED:` line

## History

`db77bdb0a`, built 2026-09-27 (ward run `1790547603729-3586`): the column and field read `MEMORY` and the help explains it. The JSON names `rssMB` and `rssAtLastBeat` are gone from today's code: `instance-status-contract.ts:47` holds one `memory` field (DEF-107). Only the `MONITORED:` wording is left.
