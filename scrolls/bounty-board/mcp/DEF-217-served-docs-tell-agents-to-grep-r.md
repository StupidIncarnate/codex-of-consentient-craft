# DEF-217: Two served docs tell agents to run `grep -r ... packages/*/dist/`, which this repo's hook blocks

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Priority | P3: a doc line, location not confirmed |
| Package | mcp |
| Found | 2026-09-30, walkthrough exploration (feature doc, not re-checked) |
| Moved from | `scrolls/walkthrough/features/07-ward.md`, "Known open items"; 2026-09-30 |

## What is wrong

The feature doc says `get-testing-patterns` and `get-syntax-rules` instruct `grep -r ... packages/*/dist/`. The repo's `PreToolUse` hook blocks shell `grep`. A search of the statics files found only a `grep -r` example inside `dumpster-create-prompt-statics.ts:463` (a predicate example), so the location is unconfirmed.

## What should happen

Find the served text, replace the instruction with a `discover` call, and keep the docs free of commands the hooks block.

## Where to look

- Served texts behind `get-testing-patterns` and `get-syntax-rules` (find them first)
- `packages/orchestrator/src/statics/dumpster-create-prompt/dumpster-create-prompt-statics.ts:463`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
