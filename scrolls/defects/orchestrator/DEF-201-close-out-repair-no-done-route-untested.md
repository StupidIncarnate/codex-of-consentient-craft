# DEF-201: The shared `CLOSE_OUT.repair` step declares no `done` route and no test drives it

| | |
|---|---|
| Status | suspected |
| Package | orchestrator |
| Found | 2026-09-30, walkthrough case OR-19 (code read) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "OR-19", and `scrolls/walkthrough/features/03-orchestrator-step-engine.md`, "Known open items"; 2026-09-30 |

## What is wrong

`CLOSE_OUT.repair` (shared by codeweaver, flowrider and siegemaster) has `routes: { unmet: 'repair', wall: '@blocked' }` and no `done`
(`agent-flow-statics.ts:96-103`). A repair after a red family `ward` returns to the step that minted it. The risk is a
`{ reason: 'no-minter' }` block instead of a return to `ward`. `scrolls/orcha-changes/HANDOFF.md` calls the path reachable but untested.

Today's code: the router stamps `mintedBy` on the plain gate mint when the target declares no `done` (packages/orchestrator/CLAUDE.md,
"The gate/repair fixpoint"), so it probably works. The only `no-minter` test found is for `fixHappy`
(`next-action-transformer.test.ts:462`). Nothing drives `CLOSE_OUT.repair` after a red family ward.

## What should happen

An integration test drives a red family `ward`, then `repair`, and asserts the quest returns to `ward` and never blocks with `no-minter`. If it blocks, fix the stamp.

## Where to look

- `packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts:96-103`
- `packages/orchestrator/src/transformers/next-action/next-action-transformer.ts` and `.test.ts:462`
- `docs/quest-role-paths.md` (role path list)

## History

Case OR-19 in the walkthrough exercises this path.
