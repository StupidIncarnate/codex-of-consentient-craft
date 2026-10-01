# DEF-147: Why a seeded completed quest shows the `OPERATIONS` fallback, not `STEPS`, was never checked

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Priority | P3: an unchecked suspicion about a seeded view |
| Package | web |
| Found | 2026-09-28, walkthrough case SL-195 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

Completed-quest execution view (`inst_e4fc1619fe3d452bb5547f10cac0bd2e` run_24 `exec-complete.png`, `quest-completed` recipe, Verified Flow). The lane showed the `OPERATIONS` fallback header instead of `STEPS`, which suggests the projection is unusable for a seeded quest. Nobody checked why.

The fixed items: DEBT reads `no cant-meet or unmet marks — N outstanding, not proven` when units are outstanding; the `OPERATIONS` fallback header counts the rows it heads; no Resume on a complete quest (only `paused` or `blocked` are resumable; the screen was a blocked quest). The doc on `quest-summary-contract.ts:29` now says `debt` is every unit that is not proven.

## What should happen

Find out why the projection is unusable for a seeded quest. If real, fix the seed or the projection. If not, delete this file.

## Where to look

The execution panel widgets under `packages/web/src/widgets/` (search `OPERATIONS`), the quest projection in `packages/shared` or `packages/orchestrator`, and the `quest-completed` recipe in `packages/hydration-recipes`.

## History

Items 1 and 2 fixed: `0ec550842`, merge `646dc1a36`, ward run `1790722047488-591e`.
