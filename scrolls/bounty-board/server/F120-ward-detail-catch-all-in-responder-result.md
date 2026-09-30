# F120: `wardDetailContract` is the loose last union member, so any object that fails the others passes as ward detail

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | server |
| Found | big-bang server agent (b6047b634) |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`packages/server/src/contracts/responder-result/responder-result-contract.ts`: zod returns the first union member that parses, so the members are `.strict()`. `wardDetailContract` is loose by design and sits last, so any object that fails every other member passes as ward detail.

Checked 2026-09-30: the file's comment at line 52 and the `.strict()` members are still there.

## What should happen

**Decided by the user, 2026-09-30: the epic's recommended route, D2.** Ward detail responses get an envelope, `questWardDetailResponseDataContract = z.strictObject({ detail: wardDetailContract })`, like every other `*-response-data` member, and `wardDetailContract` leaves the union, so it is no longer the catch-all. The web broker `quest-ward-detail-broker.ts` returns `parsed.detail`, so `WardDetail` and its widgets keep their types. The body of `GET /api/quests/:questId/ward-results/:wardResultId` changes; both ends are in this repo. The batch plan is in `scrolls/brands-gateways-epic/items/f120-f129-bigbang-followups.md`, "F120".

## Where to look

`packages/server/src/contracts/responder-result/responder-result-contract.ts`.

## History

The plan and the recommended decision D2 are in `scrolls/brands-gateways-epic/items/f120-f129-bigbang-followups.md`, section "F120: ward detail must not be the catch-all member of `responderResultContract`".
