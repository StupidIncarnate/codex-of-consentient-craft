# F126: server response-data `processId` and `chatProcessId` carry their own brands

| | |
|---|---|
| Status | ready |
| Package | server |
| Found | big-bang R7 agent |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`processId` and `chatProcessId` fields in the server's response-data contracts carry their own owner+key brands, because `orchestrationProcessContract.shape.processId` is not exported from `@dungeonmaster/orchestrator`.

Checked 2026-09-30: for example `quest-start-response-data-contract.ts:13` `processId: z.string().brand<'QuestStartResponseDataProcessId'>()`, `quest-new-response-data-contract.ts:15`, `quest-followup-response-data-contract.ts:12`, `quest-chat-response-data-contract.ts:12`, `quest-clarify-response-data-contract.ts:12`, `ws-incoming-message-contract.ts:23`, `chat-output-routing-contract.ts:17`, `dev-log-event-payload-contract.ts:27`, all under `packages/server/src/contracts/`.

## What should happen

Export the orchestrator field and reuse the owner field (B4).

## Where to look

`packages/server/src/contracts/*-response-data/`, `ws-incoming-message`, `chat-output-routing`, `dev-log-event-payload`; the export in `@dungeonmaster/orchestrator`.

## History

The plan and recommended decision D5 are in `scrolls/brands-gateways-epic/items/f120-f129-bigbang-followups.md`, section "F126: server response-data `processId` and `chatProcessId` reuse the owner's field".
