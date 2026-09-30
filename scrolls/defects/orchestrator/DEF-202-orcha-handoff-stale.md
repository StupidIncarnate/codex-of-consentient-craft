# DEF-202: `scrolls/orcha-changes/HANDOFF.md` says work is owed that is already done

| | |
|---|---|
| Status | ready |
| Package | orchestrator |
| Found | 2026-09-30, walkthrough exploration (OR · docs) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "OR · docs", and `scrolls/walkthrough/features/03-orchestrator-step-engine.md`, "Known open items"; 2026-09-30 |

## What is wrong

The handoff says the graph reachability check at boot is unwired. `packages/server/src/startup/start-server.ts:15,32` calls
`GraphReachabilityBootFlow()`. It also names an `orch-codeweaver-partial` smoketest scenario as dead; `smoketest-scenarios-statics.ts`
now declares only `orchHappyPath` and `orchReachesFlowrider`, so the scenario is already gone. The rest of its "Owed" section needs the same re-check.

## What should happen

Edit HANDOFF.md: remove the two stale items, re-verify every other "Owed" line against master, or delete the file if nothing real is left.

## Where to look

- `scrolls/orcha-changes/HANDOFF.md`
- `packages/server/src/startup/start-server.ts:15,32`
- `packages/orchestrator/src/statics/smoketest-scenarios/smoketest-scenarios-statics.ts`

## History

Verified against master by the 03 feature doc author.
