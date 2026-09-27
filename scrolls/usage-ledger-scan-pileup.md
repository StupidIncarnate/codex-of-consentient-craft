# Usage-ledger scans pile up in every MCP server

Status: fix 1 (the single-flight guard) is in. `usageLedgerScanFlightState` records a running scan, and
`EvaluateHoldLayerResponder` starts no second scan while one runs. A tick that lands mid-scan still evaluates the hold,
on the last published reading. Fixes 2 to 4 are still open. A running MCP server picks up fix 1 only after the
orchestrator package is rebuilt and the session is restarted.

Companion to `scrolls/mcp-caller-cwd-via-hook.md`. That doc covers why each MCP tool call is slow. This one covers why
an MCP server burns CPU when no call is running.

## The symptom

Measured on 2026-09-27, about 20:12 to 20:22 UTC. Every dungeonmaster MCP server on the machine sat at 80% to 130% CPU
with no tool call in flight. Load average stayed near 7.

| PID | Age | Home (`DUNGEONMASTER_HOME`) | CPU over 5 s | Open transcript handles |
|---|---|---|---|---|
| 3914156 | 4 min | `<repo>/.dungeonmaster` | 119% | 0 to 16 |
| 3795461 | 29 min | `<repo>/.dungeonmaster` | 119% | 0 to 12 |
| 634764 | 5 days | `<repo>/.dungeonmaster` | 120% | about 460 to 620 |
| 1063997 | 13 hours | `<repo>/worktrees/gateway-pivot/.dungeonmaster` | 134% | about 1,950 to 2,010 |

## What runs

The MCP stdio server calls `StartOrchestrator.bootstrap()` from its own `OrchestrationBootFlow`. That starts
`RateLimitsBootstrapResponder`, which ticks every 5 s (`DEFAULT_POLL_INTERVAL_MS`). Each tick calls
`EvaluateHoldLayerResponder`, which calls `usageLedgerScanBroker` without awaiting it.

`usageLedgerScanBroker` does this:

1. Reads `<home>/usage-ledger.json`.
2. Returns at once if `updatedAt` is under 60 s old (`usageAccountingStatics.scan.minIntervalMs`).
3. Otherwise walks all of `~/.claude/projects`: 2,938 files, 3.96 GB. It keeps the 873 files changed in the last 7
   days, which hold 1.78 GB.
4. Reads each file from its cursor to the end, 16 files at a time, and folds token counts into hourly buckets.
5. Writes the ledger with `updatedAt` set to the time the scan **started**.

## Why it piles up

1. **No single-flight guard.** A tick starts a new scan while an earlier scan is still running. Nothing checks for one
   in progress.
2. **The throttle stamp lands only when a scan finishes.** Until the first scan writes, `updatedAt` stays stale. So
   every 5-second tick starts another scan: 12 more per minute.
3. **Overlapping scans slow each other down.** Each one reads the same files and competes for the same CPU and disk. A
   slower scan lets more ticks pile on. This is a feedback loop, and it has no ceiling.
4. **A finished scan writes a stale stamp.** It stamps its own start time. A scan that ran for minutes writes a time
   that is already over 60 s old, so the next tick starts yet another scan.
5. **Several processes share one ledger.** Three servers above share `<repo>/.dungeonmaster`. Each runs its own
   poller. Their writes overwrite each other, so `updatedAt` can move backwards.

## Evidence

| Observation | Measurement |
|---|---|
| `updatedAt` in `<repo>/.dungeonmaster/usage-ledger.json`, sampled 20 s apart | 20:18:51, then 20:18:41, then 20:17:30. The stamp moved backwards, so a scan that started at 20:17:30 wrote more than 100 s later. |
| `updatedAt` in the gateway-pivot ledger, sampled 10 s apart around 20:21 UTC | 19:44:29, 19:44:40, 19:45:05. Those scans started about 37 minutes before they wrote. |
| Open transcript handles in PID 1063997 | About 2,000 handles over 659 files, with one file open 5 times. A single scan holds at most 16. |
| The same handles, sampled 10 s apart, in PID 634764 | 544, then 464. None of the first set was still open, so these are constant new reads, not a leak. |
| Full-rebuild trigger (a file shrank, or changed timestamp without growing) | Not firing. 0 of 873 cursors matched either case in three samples. |

`fsReadFileRangeAdapter` closes its handle in a `finally`, so the handles are in-flight reads, not leaked ones.

## Why only the old processes look extreme

A new server starts with a ledger another process wrote recently, so its first scans are short. The pile-up grows
with every tick where a scan is still running, so it gets worse with process age. PID 1063997 had run for 13 hours
and PID 634764 for 5 days.

## The fix

In order of importance:

1. **Add a single-flight guard.** Keep an in-flight promise in state. A tick that finds a scan running does nothing
   for the scan. It still evaluates the hold, because the tick is also the clock that lifts a hold.
2. **Stamp the throttle at scan start.** Record "scan started at T" before walking. A tick then sees a fresh stamp
   even while the scan runs. The ledger's own `updatedAt` can stay the finish time.
3. **Scan in one process per home.** Take a lock file in `<home>` (a pid plus a start time, broken when older than a
   few minutes). The others read the ledger it writes. Or decide that the MCP server never runs the poller. The HTTP
   server already does, and the MCP server may only need the hold that `dispatch-state.json` records. Check what reads
   the in-memory hold in the MCP process before choosing.
4. **Merge on write, don't overwrite.** With one writer per home, item 3 covers this. Without it, re-read the ledger
   under the lock before writing, so an older scan never replaces a newer one's cursors and stamp.

Items 1 and 2 alone stop the unbounded growth. A server then runs at most one scan at a time, and at most one per
minute.

## Relief until the fix lands

Restarting a Claude Code session restarts its MCP server and clears its backlog. The two old sessions carry most of
the load: PID 634764 (5 days old) and PID 1063997 (13 hours old, the gateway-pivot worktree). The backlog grows back
over hours, so this only buys time.

## Tests to write

1. Poller: a tick while a scan is in flight starts no second scan. It still evaluates the hold.
2. Scan: a scan that runs longer than `minIntervalMs` does not cause the next tick to start another one.
3. Two processes sharing one home: only one scans. The other reads the result.
4. Write: an older scan finishing after a newer one does not move `updatedAt` backwards.
