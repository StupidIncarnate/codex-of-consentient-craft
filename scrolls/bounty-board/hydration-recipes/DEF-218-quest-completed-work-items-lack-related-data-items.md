# DEF-218: `quest-completed` seeds work items with no `relatedDataItems` link back to their operations

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Priority | P2: a seeded completed quest may show operations as unclaimed; not confirmed |
| Package | hydration-recipes |
| Found | 2026-09-30, `scrolls/consolidated-plan-handoff.md` "Known gaps, not yet units" |
| Moved from | `scrolls/walkthrough/features/05-web-execution-panel.md`, "Known open items"; 2026-09-30 |

## What is wrong

Operations can show as unclaimed, or scopes may not group as expected, on a `quest-completed` seed (walkthrough cases EX-49, EX-64). The handoff names it as the known cause. Not re-checked in code. See also DEF-100 (extra op in the same recipe's ledger) and DEF-164.

## What should happen

The recipe links each seeded work item to its operation through `relatedDataItems`.

## Where to look

- `packages/hydration-recipes` `quest-completed` recipe

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
