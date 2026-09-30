# DEF-61: Chromium and ffmpeg pids are not in the lane record, so `kill` and `cleanup` cannot reap them

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-27, walkthrough case SL (follow-up to DEF-52) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`heartbeat.json` records only the lane's own server process groups, never Chromium's or ffmpeg's. If either outlives a driver crash, `kill` and `cleanup` cannot reap it. Seen: a SIGKILLed driver left 4 child groups, and the heartbeat named 2.

Checked 2026-09-30: the heartbeat still writes `lane.pgids` (`driver-heartbeat-tick-broker.ts:45`), `lane-boot-broker.ts` fills `livePgids` from `booted.pgids` (server groups only, `:257`), and nothing reads `browser.process()`. `instance-kill-broker.ts:136` now reads the registry row's own `pgids` (`entry?.pgids`), not the heartbeat.

## What should happen

`BrowserSession` exposes Chromium's pid, and `lane-boot-broker.ts` threads it into the lane's `pgids` so `kill` and `cleanup` reap it. ffmpeg's pid has no public Playwright API.

## Where to look

- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts:136` (`chromium.launch`, where `browser.process()?.pid` would be read; this replaces the old `playwright-session-adapter.ts`)
- `packages/siegelense/src/contracts/browser-session/browser-session-contract.ts` (add the pid)
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts:257-277`
- `packages/siegelense/src/brokers/instance/kill/instance-kill-broker.ts:136`
- `packages/siegelense/src/brokers/cleanup/run/stale-reap-layer-broker.ts`

## History

Follow-up to DEF-52 (won't fix on `master`: the idle reap runs the same `laneTeardownBroker` as `kill`, so the 7-minute leak came from the gateway-pivot build; commit `ce40a2030` added two real-process integration tests).
