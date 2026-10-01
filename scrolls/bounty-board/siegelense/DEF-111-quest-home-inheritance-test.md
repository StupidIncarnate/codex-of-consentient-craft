# DEF-111: No test that a spawned siegemaster inherits the server's `DUNGEONMASTER_HOME`

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: a missing test, and the home must be set by hand |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-048 follow-up |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`--quest` from this repo's shell resolves against `~/.dungeonmaster`, not the repo-local home `npm run prod` uses, so this repo's quests are "not resolved" unless `DUNGEONMASTER_HOME` is set by hand.

Open: (1) there is no test that a siegemaster spawned by the orchestrator, and its `siegelense` calls, inherit the orchestrator server's `DUNGEONMASTER_HOME`. Also, `start --help` (SL-064): the `--quest` line must say the quest resolves only if its guild is registered in `DUNGEONMASTER_HOME` (not confirmed done on 2026-09-30).

## What should happen

The inheritance test exists, and the `--quest` help line says the guild must be registered in `DUNGEONMASTER_HOME`.

## Where to look

`packages/orchestrator/src/` siegemaster spawn brokers, and `packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.ts` (the `start` entry).

## History

Item 2 done by the driver on 2026-09-28 at the user's request: root `package.json` `"siegelense": "DUNGEONMASTER_HOME=\"$(pwd)/.dungeonmaster\" dungeonmaster siegelense"`, checked with `status --since 1hr`.
