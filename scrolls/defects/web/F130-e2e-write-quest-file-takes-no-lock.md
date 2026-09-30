# F130: web e2e `writeQuestFile` takes no quest lock

| | |
|---|---|
| Status | ready |
| Package | web |
| Found | e2e flake fix |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

The web e2e harness's `writeQuestFile` takes no quest lock. Any spec that starts a quest and then raw-rewrites `quest.json` races the dispatcher's locked write. This is the `warpgate-queue-listing` flake.

## What should happen

Audit every spec that starts a quest and then rewrites `quest.json`, and make the write safe.

## Where to look

`writeQuestFile` in `packages/web/test/harnesses/`, and the specs that call it after starting a quest (start with `packages/web/src/flows/quest-chat/warpgate-queue-listing.e2e.ts`).

## History

Found by the e2e flake fix. Priority P2. Related: F106 (the same flake, run ids there).
