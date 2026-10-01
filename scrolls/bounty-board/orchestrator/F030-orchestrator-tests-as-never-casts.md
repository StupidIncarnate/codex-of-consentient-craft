# F30: orchestrator test files lean on `as never` casts

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P3: test-file cast cleanup |
| Package | orchestrator |
| Found | O3 review |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

Orchestrator test files cast with `as never` heavily. The EPIC counted 55 in `packages/orchestrator/src/brokers/quest/get-quest-work/quest-get-quest-work-broker.test.ts`, 37 in `quest-get-blight-checklist-broker.test.ts` and 19 in `ward-rows-layer-broker.test.ts` (counted at 9337a0bbd). They predate the pivot. A12 agents only add them when copying the local pattern.

Checked 2026-09-30: still live. `quest-get-quest-work-broker.test.ts` holds 19 (for example line 103 `operationItemId: OPERATION_ITEM_ID as never,`) and `quest-get-blight-checklist-broker.test.ts` holds 8 (line 36 `baseRef: 'a1b2c3d4' as never,`). `ward-rows-layer-broker.test.ts` is no longer in `get-quest-work/` with any `as never`; locate it before counting.

## What should happen

Replace each cast with the matching stub. Work one test file per change. This belongs with the T items' cast rules.

## Where to look

`packages/orchestrator/src/brokers/quest/get-quest-work/quest-get-quest-work-broker.test.ts`, `packages/orchestrator/src/brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker.test.ts`, and `ward-rows-layer-broker.test.ts` (find it with `discover`). Counts drift: recount first.

## History

Found by the O3 review. Counts above are from 9337a0bbd; the 2026-09-30 recount is smaller.
