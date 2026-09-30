# DEF-215: `nextActionTransformer` indexes `agentFlowStatics` with loosely typed parameters

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Package | orchestrator |
| Found | 2026-09-30, `scrolls/consolidated-plan-handoff.md` "Known gaps, not yet units" |
| Moved from | `scrolls/walkthrough/features/08-init-prompts-and-mcp.md`, "Known open items"; 2026-09-30 |

## What is wrong

The transformer does `agentFlowStatics[family]` and then checks `graph === undefined` (`next-action-transformer.ts:161-163`), so `family` is not a narrow key type. The feature doc calls it a known consistency gap, not scoped to that feature.

## What should happen

Type `family` so the index is checked at compile time, and drop the runtime undefined branch if it becomes unreachable.

## Where to look

- `packages/orchestrator/src/transformers/next-action/next-action-transformer.ts:159-165`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
