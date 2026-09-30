# DEF-260: `packages/server/CLAUDE.md` teaches adapters that no longer exist

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | server |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What is wrong

Every `src/adapters/` folder is gone, but the server's CLAUDE.md still tells agents to use them:

- `:40` — "All runtime observability logging in the server MUST go through the `processDevLogAdapter`."
- `:44` — `import { processDevLogAdapter } from '../adapters/process/dev-log/process-dev-log-adapter';`. The real one is `processDevLogBroker` in `packages/server/src/brokers/process/dev-log/`.
- `:131` — "**Gating and prefix:** `src/adapters/process/dev-log/process-dev-log-adapter.ts`"
- `:133`, `:137` — "via `processDevLogAdapter`", "everything goes through `processDevLogAdapter`"
- `:163-164` — `orchestratorOutboxWatchAdapter`, the `orchestratorEventsOnAdapter` loop
- `:199-204` — "The server uses two different homedir adapters…", naming `osUserHomedirAdapter` and `osHomedirAdapter`

An agent that follows this file writes an import that cannot resolve.

## What should happen

The file names what exists today: `processDevLogBroker`, and whatever now replaces each other adapter it names. Read the whole file, not only these lines.

## Where to look

`packages/server/CLAUDE.md`. Find each replacement with `discover` before writing its name.

## History

The gateway follow-up doc's table "Every `CLAUDE.md` and `AGENTS.md`" listed this file on 2026-09-26. The 2026-09-30 check confirmed these lines are still stale.
