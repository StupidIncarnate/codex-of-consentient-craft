# DEF-206: `/quest-forensics` jumps from Step 5 to Step 7

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | session-forensics |
| Found | 2026-09-30, walkthrough exploration (confirmed by reading the file) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "SF · `/quest-forensics`", and `scrolls/walkthrough/features/06-session-forensics.md`, "Known open items" item 4; 2026-09-30 |

## What is wrong

The command file goes from `## Step 5 — compile` (line 196) to `# PHASE 2 — the delivery-chain audit` (line 241) and `## Step 7 — the coverage baseline` (line 262). There is no Step 6.

## What should happen

Renumber Steps 7-10 to 6-9 (and fix any cross-reference), or add the missing step. Ask the file's owner if a step was dropped.

## Where to look

- `.claude/commands/quest-forensics.md:196,241,262`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
