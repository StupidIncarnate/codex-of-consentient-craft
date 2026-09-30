# DEF-78: Guild responders spot a duplicate path by matching the error text

| | |
|---|---|
| Status | ready |
| Package | server |
| Found | 2026-09-28, walkthrough cases SL-079, SL-080, SL-110 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

A duplicate guild path now answers 409, but the server decides that by text, not by error class. `guild-add-responder.ts:49` does `message.startsWith('A guild with path')`, and `guild-update-responder` does the same. `guildAddBroker` and `guildUpdateBroker` already throw `GuildPathTakenError` (`guild-add-broker.ts:70`, `guild-update-broker.ts:38`), and their tests check `toBeInstanceOf(GuildPathTakenError)`. The responder tests still pin the text (`guild-add-responder.test.ts:126-133`, `guild-update-responder.test.ts:133-143`).

## What should happen

The responders answer 409 on `error instanceof GuildPathTakenError`. The error class has to reach the server through `StartOrchestrator` (check that `@dungeonmaster/orchestrator` exports it). The old blocker was that the server reaches the orchestrator only through an adapter; adapters are gone.

## Where to look

- `packages/server/src/responders/guild/add/guild-add-responder.ts:47-55`
- `packages/server/src/responders/guild/update/guild-update-responder.ts`
- `packages/orchestrator/src/errors/guild-path-taken/guild-path-taken-error.ts` (and the orchestrator's public exports)

## History

Item 1 (duplicate POST answers 409) fixed in `95d740aef`, built 2026-09-28: a new `GuildPathTakenError`. Unique paths and ids fixed in `4549a0a3f`: a second `guild-empty` got `guild-2` with no 500, and two sessions gave `seed-session-1.jsonl` and `seed-session-2.jsonl`. Item 3 (`session-with-nested-subagent` returns a row object `{ session: { sessionId, outer, nested } }`) fixed in `03be59c36`. The unused `recipe-result` contract in `hydration-recipes` (an old leftover) is gone: a glob for `recipe-result*` finds nothing on 2026-09-30.
