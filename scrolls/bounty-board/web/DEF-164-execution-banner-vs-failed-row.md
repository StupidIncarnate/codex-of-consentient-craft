# DEF-164: The `EXECUTION COMPLETE` banner shows above a `FAILED` row

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | web |
| Found | 2026-09-28, walkthrough cases SL-057, SL-195 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

The execution view shows the green `EXECUTION COMPLETE` banner above a `FAILED` row. A quest that really succeeded can keep failed work items in its history (ward fails, spiritmender repairs, ward re-runs green), and a group of rows with no operation shows the worst status among them. So a rule like "any failed row turns the banner red" would flag healthy quests. The label text lives at `packages/shared/src/statics/quest-status-metadata/quest-status-metadata-statics.ts:318`.

## What should happen

The user must choose which failures the banner counts. For example, only a top-level row with no later success in its scope.

## Where to look

`packages/shared/src/statics/quest-status-metadata/quest-status-metadata-statics.ts:318` and the execution panel widgets in `packages/web/src/widgets/` that read it.

## History

Split out of DEF-113 and DEF-147 (`fe8f715a8`, `646dc1a36`).
