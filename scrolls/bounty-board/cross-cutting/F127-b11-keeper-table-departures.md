# F127: two R9 renames depart from B11's keeper table

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | cross-cutting |
| Found | big-bang R9 agent |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

Two departures from B11's keeper table in the R9 round (e7530699e):

1. testing's `packageJson` was renamed to `testGuildPackageJsonContract` instead of dropped. It keeps its required-field checks, and testing cannot depend on shared's.
2. The `commentBatch` rename landed on web (`commentBatchReplyContract`) instead of server.

## What should happen

**Decided by the user, 2026-09-30: one contract per shape, shared between packages. Neither departure stands as it is.**

1. **Comment batch:** the server and the web use the SAME contract for the comment-batch reply. Move one contract into `@dungeonmaster/shared/contracts` and point both `packages/server` (today `commentBatchResponseContract`, `comment-batch-response-contract.ts:14`) and `packages/web` (today `commentBatchReplyContract`, `comment-batch-reply-contract.ts:17`) at it, deleting both local copies. Settle the one shape both ends agree the 200 body has.
2. **testing's package.json:** it is not special. Delete `testGuildPackageJsonContract` (`packages/testing/src/contracts/test-guild-package-json/`) and use shared's `packageJsonContract` in `integration-environment-create-broker.ts:126` and `:169`. The old reason for a separate copy ("testing cannot depend on shared") is gone: F122 made `@dungeonmaster/shared` a dependency of testing. If a caller truly needs `name` or `version` present, it checks that at the call site.
3. **Same rule, found alongside:** `packageJsonRawContract` is defined twice with the same body, in `packages/cli/src/contracts/package-json-raw/` and `packages/ward/src/contracts/package-json-raw/`. Keep one in shared and point both at it (or fold it into `packageJsonContract` if the shapes match).

Afterwards, record what landed in `scrolls/brands-gateways-epic/items/b11-unique-contract-names.md` (the `packageJsonContract` and `commentBatch` rows).

## Where to look

`packages/testing` (`testGuildPackageJsonContract`), `packages/web` (`commentBatchReplyContract`), B11's keeper table.

## History

The plan and recommended decision D6 are in `scrolls/brands-gateways-epic/items/f120-f129-bigbang-followups.md`, section "F127: the two R9 departures from B11's keeper table".
