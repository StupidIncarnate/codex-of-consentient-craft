# F127: two R9 renames depart from B11's keeper table

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | cross-cutting |
| Found | big-bang R9 agent |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

Two departures from B11's keeper table in the R9 round (e7530699e):

1. testing's `packageJson` was renamed to `testGuildPackageJsonContract` instead of dropped. It keeps its required-field checks, and testing cannot depend on shared's.
2. The `commentBatch` rename landed on web (`commentBatchReplyContract`) instead of server.

## What should happen

The user must confirm or reverse each departure.

## Where to look

`packages/testing` (`testGuildPackageJsonContract`), `packages/web` (`commentBatchReplyContract`), B11's keeper table.

## History

The plan and recommended decision D6 are in `scrolls/brands-gateways-epic/items/f120-f129-bigbang-followups.md`, section "F127: the two R9 departures from B11's keeper table".
