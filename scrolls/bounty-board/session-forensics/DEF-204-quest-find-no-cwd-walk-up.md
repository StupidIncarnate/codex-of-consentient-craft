# DEF-204: Run from a package subdirectory, `session-forensics` does not find the quest and prints blank

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | session-forensics |
| Found | 2026-09-30, walkthrough case SF-33 (seen live) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "SF · cwd", and `scrolls/walkthrough/features/06-session-forensics.md`, "Known open items" item 3; 2026-09-30 |

## What is wrong

`questFindBroker` joins `process.cwd()` straight into its candidate roots (`<cwd>/.dungeonmaster`, `<cwd>/.dungeonmaster-dev`, then the global home),
`quest-find-broker.ts:24-28`, and skips a root with no `guilds` folder (`:30-35`). Run from any package subdirectory with a real quest id and it
returns the same silent blank output as an unknown id. Confirmed in today's code.

## What should happen

Resolve the repo root by walking up from cwd, the way `cwdResolveBroker` does (`kind: 'repo-root'`, see `packages/shared/CLAUDE.md`). An unknown id should say "quest not found", not print blank.

## Where to look

- `packages/session-forensics/src/brokers/quest/find/quest-find-broker.ts:20-45`
- `packages/shared` `cwdResolveBroker`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
