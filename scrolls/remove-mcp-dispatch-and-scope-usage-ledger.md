# Remove MCP-mode dispatch, and give the usage ledger back to the orchestrator

Status: planned, not started. **Blocked until the gateway-pivot refactor
lands** — most files named here are in that refactor's path.

This doc replaces `scrolls/mcp-caller-cwd-via-hook.md` and `scrolls/usage-ledger-scan-pileup.md`. What those two fixed is committed on master (listed at the end); what they left open is carried here.

## What was decided (2026-09-27)

1. **`/dumpster-launch` is no longer used and can
   go.** The Node dispatcher (the `/queue` page's play button) is the only way quests are dispatched.
2. **The usage ledger and its 5-hour / 7-day hold exist for the orchestrator's own Node
   dispatcher**, so it pauses spawning agents when a limit is near. They are not for MCP tools.

Today the code does the opposite of point 2. `quest-get-next-step-responder.ts` checks the hold on purpose, and its comment says why: "The guardrail binds BOTH dispatchers … without this branch an MCP-mode queue would keep dispatching Task () agents straight into a spent quota." Because of that branch, every MCP server runs the ledger poller. Point 1 removes the reason for the branch.

## Part 1: remove MCP-mode dispatch

MCP-mode dispatch is `/dumpster-launch`: a loop inside the user's own Claude session that calls the `get-next-step` MCP tool and dispatches each step as a Task () sub-agent. Everything below exists only to support that loop.

| Piece                     | What it does                                                                            | Where                                                                                                                                                                                                         |
|---------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The slash command         | Installs `.claude/commands/dumpster-launch.md`                                          | `orchestrator/src/statics/slash-commands/`, `orchestrator/src/responders/install/commands-create/`, `orchestrator/src/startup/start-install.ts`                                                               |
| The `get-next-step` tool  | Hands the loop its next step                                                            | `mcp/src/flows/quest/quest-flow.ts`, `mcp/src/contracts/get-next-step-input/`, `orchestrator/src/responders/quest/get-next-step/`                                                                             |
| Dispatcher exclusivity    | Stops Node play while an MCP loop is live, and the reverse                              | `shared/src/contracts/dispatch-state/` (`mcpHeartbeatAt`, `mode`), `orchestrator/src/brokers/dispatch-state/heartbeat/`, `…/play-gate/`, `orchestrator/src/statics/orchestration-dispatch/` (`mcpIdleReason`) |
| Sub-agent identity        | `get-agent-prompt` stamps the Task sub-agent's `sessionId` + `agentId` on its work item | `mcp/src/responders/interaction/handle/resolve-subagent-identity-layer-responder.ts`, `orchestrator/src/brokers/agent-prompt/get/`                                                                            |
| Sub-agent chat tailing    | Tails `subagents/agent-<id>.jsonl` for Task-dispatched agents                           | `orchestrator/src/brokers/quest/monitor-jsonl-watcher/`, `…/monitor-watcher-start/`, `server/src/responders/quest-driven-watchers/`                                                                           |
| Dispatcher chatter filter | Keeps the loop's own tool calls out of the chat panel                                   | `server/src/statics/dispatcher-mcp-tools/`, `server/src/transformers/monitor-session-filter-chat-output/`, `…/filter-parent-source-entries/`                                                                  |
| UI                        | The "Run /dumpster-launch in your Claude session" banner                                | `web/src/widgets/dumpster-command-banner/`, `web/src/widgets/execution-panel/`                                                                                                                                |

A search on 2026-09-27 for `dumpster-launch`, `mcpHeartbeat`, `mcpIdleReason` and `dispatcher-mcp-tools` hit 54 source files and 50 test files across `mcp`, `orchestrator`, `server`, `shared`, `web` and `hooks`, plus
`orchestrator/CLAUDE.md`, `orchestrator/README.md`, `mcp/CLAUDE.md` and `hooks/CLAUDE.md`. Many only mention it in a comment. Re-run that search when this starts; the table above is the map, not the full list.

**Keep these — Node-dispatched agents use them
too.** Every headless `claude -p` child the Node dispatcher spawns has the dungeonmaster MCP server and calls `get-agent-prompt`, `quest-work` and `signal-back` through it. Only
`get-next-step` and the exclusivity machinery are MCP-mode alone.

**Watch for these simplifications, and check each one.**

1. `agentId` is only ever set by the MCP-mode path. A Node child is a top-level session: its `sessionId` comes from its init line and its `agentId` stays unset. So code that branches on `agentId` — the resume-versus-fresh decision in
   `buildSpawnInstructionLayerBroker` (`sessionId !== undefined && agentId === undefined`), the play gate's refusal while an item has `agentId` stamped, the sub-agent chat replay — may reduce to its Node branch.
2. The two-source sub-agent correlation in `orchestrator/CLAUDE.md` exists because Task sub-agents write
   `subagents/agent-<id>.jsonl`. Node children can still dispatch their own sub-agents, so check before deleting any of it.

## Part 2: the usage ledger belongs to the Node dispatcher

1. **`get-next-step` stops reading the
   hold.** This disappears with the tool in Part 1. If the tool outlives Part 1, delete the hold branch in `QuestGetNextStepResponder` anyway.
2. **The MCP server stops starting the rate-limits poller.** Today `StartMcpServer`'s own `OrchestrationBootFlow` calls
   `StartOrchestrator.bootstrap()`, which starts every passive watcher, the poller included. Give `bootstrap()` a way to skip it — or give the MCP server a narrower bootstrap — so only the HTTP server polls. Check each of the other watchers `bootstrap()` starts too (execution-queue broadcast, Node dispatch runner wake sources, smoketest listener, stale-process watchdog); most look server-only.
3. **Result: one poller per dungeonmaster home, in the HTTP
   server.** This removes the ledger's load from every Claude session, and it makes the old "one scanning process per home" item unnecessary.

## Part 3: the ledger rebuild bursts

These still matter after Part 2, because the HTTP server keeps the poller.

**What the 4-hour run
showed.** Roughly every 15 minutes, every MCP server did a large read at the same moment: 11 to 18 s of CPU each, and a memory spike to 500 to 900 MB for one sample, against a resting 0.2 to 0.6% CPU and 100 to 270 MB. The cost matches one full read of the last 7 days of transcripts (about 1.8 GB), so the suspect is a full ledger rebuild.

**What triggers a
rebuild.** `usageLedgerScanBroker` rebuilds from scratch when any tracked transcript shrank, or changed its mtime without growing. At 16:29 none of the 923 tracked files matched, so the trigger is momentary and the next scan has already moved past it.

To do:

1. **Log the
   trigger.** When `needsRebuild` is true, write one stderr line naming the file and which condition it hit. That settles the cause.
2. **Fix the
   cause.** Depending on what the log shows: a rebuild per file rather than for the whole ledger, or tolerating an mtime change on an unchanged size.
3. **Stamp the throttle when a scan
   starts**, not when it ends. A scan that outlives `minIntervalMs` otherwise lets the next tick start another one straight after it.

## Part 4: finish the caller-hook clean-up

The `dungeonmaster-pre-mcp-caller` hook now supplies every MCP call's caller (`cwd`, `sessionId`, `agentId`). Each resolver keeps its transcript scan only as a fallback for calls no hook touched. Once every consumer has regenerated its settings, delete the fallbacks:

| In `packages/mcp/src`                                                                              | Fate                                                                                    |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| `brokers/claude-code-caller-cwd/` (find-by-tool-use-id, scan-cached-entries)                       | delete                                                                                  |
| `brokers/claude-code-session/find-by-tool-use-id/` and `…/resolve/`                                | delete, with the newest-mtime fallback in `ResolveCallerSessionLayerResponder`          |
| `brokers/claude-code-parent-session/find-by-tool-use-id/`                                          | delete — Part 1 may remove its caller anyway                                            |
| `state/caller-cwd-scan-cursor/`, `statics/caller-cwd-scan-cursor/`, `statics/claude-session-scan/` | delete                                                                                  |
| `contracts/caller-cwd-scan-cursor/`, `contracts/claude-code-tool-use-scan-line/`                   | delete, unless something else imports them                                              |
| `transformers/caller-repo-root-banner/`                                                            | reword the fallback WARNING, which still blames "no matching Claude Code session JSONL" |

The fallback is slow for a reason worth keeping in mind. Claude Code writes a call's own `tool_use` line only when the call finishes or is moved to the background, so during the call every scan pass misses.

## Already on master

| Commit      | What it did                                                                               |
|-------------|-------------------------------------------------------------------------------------------|
| `3e59959e7` | At most one usage-ledger scan per process (`usageLedgerScanFlightState`).                 |
| `212d65391` | The `dungeonmaster-pre-mcp-caller` PreToolUse hook, and MCP resolvers that read it first. |

Measured after both, 2026-09-27, 14:18 to 18:28, five MCP servers sampled every 5 minutes:

|                                           | Before                                     | After                               |
|-------------------------------------------|--------------------------------------------|-------------------------------------|
| A narrow `discover` call                  | 46.4 s                                     | 0.66 s                              |
| MCP server memory                         | 4.0 GB (5 days old), 5.1 GB (13 hours old) | Level at 100 to 270 MB over 4 hours |
| Open transcript files per server          | Up to about 2,000                          | 0 at every sample                   |
| Usage-ledger `updatedAt` behind the clock | About 37 minutes                           | 60 s at most                        |
