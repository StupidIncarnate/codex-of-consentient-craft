# DEF-69: `kill` liveness check does not confirm a pgid is still this lane's

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-27, walkthrough case SL-063, SL-165 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`kill` asks only whether anything is alive at a pgid (`kill(-pgid, 0)` in `process-is-alive-broker.ts:23`), not whether it is still this lane's group. If the OS reused the pgid for an unrelated process, it would pass and the process would be signalled. The broker's own header says it verifies the group is "still this lane's own", but the probe cannot.

## What should happen

Before signalling, confirm the group is still the one this lane started (for example compare the group leader's start time or command line with what was recorded at boot). The old note said this needs a new OS adapter; with the pivot that is a `#gateway/node` wrapper.

## Where to look

- `packages/siegelense/src/brokers/instance/kill/instance-kill-broker.ts:136` and `:144` (the two `processIsAliveBroker` calls; the old ledger cited `:123`)
- `packages/siegelense/src/brokers/process/is-alive/process-is-alive-broker.ts:23`
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.ts` uses the same gate

## History

`ffe443e39`, built: tombstoned instances are never re-signalled, and teardown reports what it stopped. The driver saw a first `kill` report `PROCESSES REAPED: 2 (259793, 259795)` and a repeat `kill` report `0 (none)`. Original report: `kill --instance inst_b8c04171bb824282997b0c0ad676cbb8` stopped the live driver and both server groups but printed `PROCESSES REAPED: 0 (none)`; a repeat `kill` of a dead instance printed `PROCESSES REAPED: 2 (104541, 104543)`, re-signalling stale pgids from `heartbeat.json`.
