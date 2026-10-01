# DEF-137: No UI to fix or remove a guild with an invalid path

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | web |
| Found | 2026-09-29, walkthrough case SL-088 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

After a bad guild (DEF-136) landed, `GET /api/guilds` returned HTTP 500 `{"error":"[{\"code\":\"custom\",\"message\":\"Path must be absolute (start with / or C:\\\\ on Windows)\",\"path\":[]}]"}`: one invalid entry broke the whole guild list, and `/` fell back to the first-run screen (a bare NEW GUILD form with no CANCEL, no guild list and no quest bar). run_33's console also held `[use-quest-queue] Error: GET /api/quests/queue failed with status 500`. The contract, route and form guards now stop new bad guilds. What is left: no UI to fix or remove a bad guild, and the list does not show an invalid entry flagged. Not re-checked on 2026-09-30 whether the list skips or flags a bad entry that is already in a config.

## What should happen

The list loads, and the bad entry is returned flagged invalid (the API already carries a `valid` field) so the UI can show it and offer to fix or remove it. The home page renders an error, not a blank list.

## Where to look

`packages/orchestrator/src/brokers/guild/list/`, `packages/server/src/responders/guild/list/`, and the home page widgets under `packages/web/src/widgets/`.

## History

`958e3d0c3`, merge `4c5d9ab62` fixed the path guard. The 4 real guilds vanished from the UI in the original report (run_30 step1.png).
