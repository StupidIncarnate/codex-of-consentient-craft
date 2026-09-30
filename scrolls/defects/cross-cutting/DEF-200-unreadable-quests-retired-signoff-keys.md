# DEF-200: Three quests show UNREADABLE because their flow nodes carry sign-off keys the strict contract no longer knows

| | |
|---|---|
| Status | needs decision |
| Package | cross-cutting |
| Found | 2026-09-30, live in the web quest list; earlier seen by the session-forensics exploration (SF coverage/quest) and walkthrough case MK-28 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" rows "SF · coverage, quest" and "MK-28", and `scrolls/walkthrough/features/06-session-forensics.md`, "Known open items" item 2; 2026-09-30 |

## What is wrong

The operator saw the web quest list show three quests as UNREADABLE on 2026-09-30:

- `1dac5395-c828-4472-868c-d4a3425e43a0`
- `b4c31633-913d-4ea3-912a-76ae0d64bec4`
- `c8171a64-b937-47ec-85e0-a86767976d8b`

Each row shows an error like `flows.0.nodes.7: Unrecognized keys: "codeweaverSignoff", "flowriderSignoff", "siegemasterSignoff"`.
The strict flow-node contract rejects the sign-off keys that commit `9939caa87` (story 26) retired. The UI copes: a per-row
reason plus the notice "3 quest files could not be read". The same three quests were already named in DEF-109 (the
`[quest-list] skipping unloadable quest` warnings).

The same cause hits `dungeonmaster session-forensics`. `coverage` and `quest` print BLANK, with no warning, for such a quest
(seen live on `b4c31633-...`, whose `quest.json` holds 2 flows with pre-migration `codeweaverSignoff` / `flowriderSignoff` keys on
the nodes). `questLoadBroker` runs `flowContract.array().safeParse(questJson.flows)`, and on failure it returns `flows: []`
(`quest-load-broker.ts:46-54`). Any quest written before the sign-off retirement reads as having zero flows.

Walkthrough case MK-28 also asked for a test that an old `quest.json` with `codeweaverSignoff` on an OBSERVABLE still loads.
`flowObservableContract` is not `.strict()`, so it should, but no test says so.

## What should happen

The user chooses how to clear the three files, and the tools must stop hiding the failure.

Choice for the user:
1. Strip the retired keys from the three quest files, or delete the quests if they are dead; and/or
2. Make quest loading tolerate retired keys (drop them on read) instead of rejecting the whole flow.

Either way, session-forensics must say when flows failed to parse. It must not print a blank result.
Add the MK-28 test: an old `quest.json` with `codeweaverSignoff` on an observable loads.

## Where to look

- `packages/shared/src/contracts/flow-node/flow-node-contract.ts:46` (`.strict()`; node keys are id, label, type, packages, observables)
- `packages/shared/src/contracts/flow-observable/flow-observable-contract.ts` (not strict; MK-28 test goes with it)
- `packages/session-forensics/src/brokers/quest/load/quest-load-broker.ts:46-54` (swallows the parse failure)
- Quest files: `~/.dungeonmaster/guilds/*/quests/<id>/quest.json` and the repo-local `.dungeonmaster/` home

## History

Commit `9939caa87` retired the sign-off tracks. DEF-109 fixed the noisy `start` warnings for the same three quests (`f7b0ae083`); the quest files themselves are unchanged.
