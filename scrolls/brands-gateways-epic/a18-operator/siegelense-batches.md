# siegelense A18 re-census

Scan: raw-import-ban + platform-globals-ban + bin-program-spawn-ban over packages/siegelense (config tmp/a18-siegelense-census.config.js, runner tmp/a18-siegelense-census.mjs, JSON tmp/a18-siegelense-census.json, per-file summary tmp/a18-siegelense-rows.json).
Result: 797 messages in 308 files (platform-globals-ban 570, raw-import-ban 227, bin-program-spawn-ban 0). 199 files are zod-only; 109 files need hand work, in 33 batches below.

## What changed against the plan's siegelense section

- The zod-only list is identical: the same 199 files.
- Gone from the plan (done since): lane-teardown-broker.proxy.ts, prune-assets-list-broker.proxy.ts, siegelense-fleet-responder (.ts and .proxy.ts; the fleet responder no longer exists). Plan B23/B28 fleet lines drop.
- New, not in the plan: driver-live-check-broker.ts and .test.ts (process.pid); install-finalize-flow.integration.test.ts (process.env x2).
- instance-kill-broker.proxy.ts no longer imports raw net (only fs and fs/promises remain).
- The plan's B-numbers are replaced by S-numbers below. No batch waits on GN1..GN5 any more (all done).
- bin-program-spawn-ban flags nothing after R1. The only spawns in prod code are spawnDetached in instance-start-broker.ts and lane-boot-broker.ts (#gateway/node/child_process), whose program comes from the lane spec's data (npm, npx, sh) — no literal program in code, so no #gateway/bin/<program> swap applies. Other command: literals are test data.
- browser-session-launch-broker.ts lines 540-627 (window, navigator, atob, Blob, ClipboardItem: 19 hits) are page.evaluate code, the known A19 false positive; leave them. Its real hits are process.env/stderr (lines 138, 240, 397, 418, 612).
- No file needs C2, C3 or C4 as far as the rule output shows. Watch: driver-fleet.harness.ts has an aliased `resolve` from path (double report, clears with #gateway/node/path) and an `import process` from raw process; evidence-tree harness uses raw child_process (check which program it spawns).

## Hand batches, dependency order (leaf brokers, layers, responders, harnesses, then integration tests)

### S01 — boot-lock and driver-live-check (process.pid, setTimeout)
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.ts` — process.pid, setTimeout
- `packages/siegelense/src/brokers/boot-lock/acquire/boot-lock-acquire-broker.test.ts` — process.pid×4
- `packages/siegelense/src/brokers/driver/live-check/driver-live-check-broker.ts` — process.pid
- `packages/siegelense/src/brokers/driver/live-check/driver-live-check-broker.test.ts` — process.pid×2

### S02 — driver heartbeat and heartbeat-write (process.pid, process.stderr)
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.ts` — process.pid, process.stderr
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.proxy.ts` — process.stderr
- `packages/siegelense/src/brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker.test.ts` — process.pid
- `packages/siegelense/src/brokers/heartbeat/write/heartbeat-write-broker.ts` — process.stderr

### S03 — instance kill and run proxies (raw fs, fs/promises)
- `packages/siegelense/src/brokers/instance/kill/instance-kill-broker.ts` — process.stderr, setTimeout
- `packages/siegelense/src/brokers/instance/kill/instance-kill-broker.proxy.ts` — import:fs, import:fs/promises
- `packages/siegelense/src/brokers/instance/run/instance-run-broker.proxy.ts` — import:fs, import:fs/promises

### S04 — instance reserve (crypto, process.pid, process.cwd)
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.ts` — crypto, process.pid
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.proxy.ts` — crypto
- `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.test.ts` — process.pid×3, process.cwd

### S05 — instance start (process.env, execPath, stderr, crypto, setTimeout, raw fs)
- `packages/siegelense/src/brokers/instance/start/instance-start-boot-poll-layer-broker.ts` — setTimeout
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts` — process.stderr×6, process.env, process.execPath
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.proxy.ts` — import:fs, import:fs/promises, process.stderr, crypto, process.execPath

### S06 — lane boot and ready-wait (process.env, Buffer, setTimeout; spawnDetached with data-driven program)
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts` — process.env
- `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.proxy.ts` — process.env
- `packages/siegelense/src/brokers/lane/boot/server-log-reader-layer-broker.ts` — Buffer×2
- `packages/siegelense/src/brokers/lane/ready-wait/lane-ready-wait-broker.ts` — setTimeout

### S07 — lane teardown and registry lock (stderr, setTimeout)
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.ts` — process.stderr×2, setTimeout
- `packages/siegelense/src/brokers/lane/teardown/lane-teardown-broker.test.ts` — process.stderr×2
- `packages/siegelense/src/brokers/registry/lock-acquire/registry-lock-acquire-broker.ts` — setTimeout

### S08 — profile read and profile-solo read (process.stderr)
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.ts` — process.stderr×2
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.proxy.ts` — process.stderr
- `packages/siegelense/src/brokers/status/read/profile-solo-read-layer-broker.ts` — process.stderr
- `packages/siegelense/src/brokers/status/read/profile-solo-read-layer-broker.proxy.ts` — process.stderr

### S09 — profile sample-record and run-execute (stderr; raw fs and zod in run-execute proxy)
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.ts` — process.stderr
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.proxy.ts` — process.stderr
- `packages/siegelense/src/brokers/run/execute/run-execute-broker.ts` — process.stderr×2
- `packages/siegelense/src/brokers/run/execute/run-execute-broker.proxy.ts` — import:fs, import:fs/promises, import:zod

### S10 — results read (Buffer, raw os)
- `packages/siegelense/src/brokers/results/read/results-read-broker.proxy.ts` — import:os
- `packages/siegelense/src/brokers/results/read/results-read-broker.test.ts` — Buffer×4
- `packages/siegelense/src/brokers/results/read/server-window-read-layer-broker.ts` — Buffer
- `packages/siegelense/src/brokers/results/read/server-window-read-layer-broker.test.ts` — Buffer×4

### S11 — shot blank-read and change-read (Buffer)
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.ts` — Buffer
- `packages/siegelense/src/brokers/shot/blank-read/shot-blank-read-broker.proxy.ts` — Buffer
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.ts` — Buffer×2
- `packages/siegelense/src/brokers/shot/change-read/shot-change-read-broker.proxy.ts` — Buffer

### S12 — step dispatch, hold, until-buffer-match (stderr, Buffer, zod, pngjs, setTimeout)
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts` — process.stderr×6
- `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.proxy.ts` — import:zod, Buffer
- `packages/siegelense/src/brokers/step/hold/step-hold-broker.proxy.ts` — import:pngjs, Buffer
- `packages/siegelense/src/brokers/step/until/until-buffer-match-layer-broker.ts` — setTimeout

### S13 — until-file-wait, step-video proxy, socket-path test (setTimeout, raw fs, Buffer)
- `packages/siegelense/src/brokers/step/until/until-file-wait-layer-broker.ts` — setTimeout
- `packages/siegelense/src/brokers/step/video/step-video-broker.proxy.ts` — import:fs, import:fs/promises
- `packages/siegelense/src/brokers/locations/socket-path-find/locations-socket-path-find-broker.test.ts` — Buffer

### S14 — browser-session launch (process.env, stderr, Buffer; window/navigator/atob/Blob/ClipboardItem are page.evaluate false positives, leave)
- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts` — process.env, process.stderr×4, window×7, navigator×4, atob×2, Blob×2, ClipboardItem×2
- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.test.ts` — Buffer×2
- `packages/siegelense/src/brokers/browser-session/launch/paste-payload-layer-broker.test.ts` — Buffer×9

### S15 — capacity and cleanup responders (process.stdout)
- `packages/siegelense/src/responders/siegelense/capacity/siegelense-capacity-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/capacity/siegelense-capacity-responder.proxy.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/cleanup/siegelense-cleanup-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/cleanup/siegelense-cleanup-responder.proxy.ts` — process.stdout

### S16 — compare and docs responders (process.stdout)
- `packages/siegelense/src/responders/siegelense/compare/siegelense-compare-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/compare/siegelense-compare-responder.proxy.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/docs/siegelense-docs-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/docs/siegelense-docs-responder.proxy.ts` — process.stdout

### S17 — kill and recipes responders (process.stdout)
- `packages/siegelense/src/responders/siegelense/kill/siegelense-kill-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/kill/siegelense-kill-responder.proxy.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/recipes/siegelense-recipes-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/recipes/siegelense-recipes-responder.proxy.ts` — process.stdout

### S18 — results and run responders (process.stdout)
- `packages/siegelense/src/responders/siegelense/results/siegelense-results-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/results/siegelense-results-responder.proxy.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.proxy.ts` — process.stdout

### S19 — snapshots and start responders (process.stdout)
- `packages/siegelense/src/responders/siegelense/snapshots/siegelense-snapshots-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/snapshots/siegelense-snapshots-responder.proxy.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/start/siegelense-start-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/start/siegelense-start-responder.proxy.ts` — process.stdout

### S20 — status and prune responders (process.stdout, process.stderr)
- `packages/siegelense/src/responders/siegelense/status/siegelense-status-responder.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/status/siegelense-status-responder.proxy.ts` — process.stdout
- `packages/siegelense/src/responders/siegelense/prune/siegelense-prune-responder.ts` — process.stderr, process.stdout×2
- `packages/siegelense/src/responders/siegelense/prune/siegelense-prune-responder.proxy.ts` — process.stdout, process.stderr

### S21 — driver idle-wait and install link-create proxy (setTimeout, clearTimeout, raw fs/promises)
- `packages/siegelense/src/responders/siegelense/driver/driver-idle-wait-layer-responder.ts` — setTimeout×2, clearTimeout
- `packages/siegelense/src/responders/siegelense/driver/driver-idle-wait-layer-responder.proxy.ts` — setTimeout
- `packages/siegelense/src/responders/install/link-create/install-link-create-responder.proxy.ts` — import:fs/promises

### S22 — driver serve layer (process.on, stderr, setInterval, clearInterval, setImmediate)
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.ts` — process.on, process.stderr×5, setInterval, clearInterval
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.proxy.ts` — process.?×2, process.stderr
- `packages/siegelense/src/responders/siegelense/driver/driver-serve-layer-responder.test.ts` — setImmediate

### S23 — siegelense driver responder and siegelense-flow (process.pid, stderr, stdout)
- `packages/siegelense/src/responders/siegelense/driver/siegelense-driver-responder.ts` — process.stderr, process.pid
- `packages/siegelense/src/responders/siegelense/driver/siegelense-driver-responder.test.ts` — process.pid
- `packages/siegelense/src/flows/siegelense/siegelense-flow.ts` — process.stdout×3

### S24 — harnesses: driver-fleet, npm-command-fake (raw fs/net/process/path, setTimeout, env)
- `packages/siegelense/test/harnesses/driver-fleet/driver-fleet.harness.ts` — import:fs, import:net, import:process.?, import:path, resolve, process.env×2, setTimeout×4, process.stderr×2
- `packages/siegelense/test/harnesses/npm-command-fake/npm-command-fake.harness.ts` — import:path, resolve, process.env×3

### S25 — harnesses: evidence-age, seed-home, snapshot-store (raw fs, path, crypto)
- `packages/siegelense/test/harnesses/evidence-age/evidence-age.harness.ts` — import:fs, import:fs/promises
- `packages/siegelense/test/harnesses/seed-home/seed-home.harness.ts` — import:fs, import:path
- `packages/siegelense/test/harnesses/snapshot-store/snapshot-store.harness.ts` — import:fs/promises, crypto

### S26 — harness: evidence-tree (raw child_process, fs, pngjs, Buffer, env, process.kill)
- `packages/siegelense/test/harnesses/evidence-tree/evidence-tree.harness.ts` — import:child_process, import:fs, import:pngjs, Buffer, process.env×4, process.kill, process.stderr

### S27 — integration tests: profile sample-record and prune run (env, chdir, cwd)
- `packages/siegelense/src/brokers/profile/sample-record/profile-sample-record-broker.integration.test.ts` — process.env×4, process.cwd, process.chdir×2
- `packages/siegelense/src/brokers/prune/run/prune-run-broker.integration.test.ts` — process.env×4

### S28 — integration tests: driver-flow, install-flow, install-finalize-flow (env, cwd, chdir)
- `packages/siegelense/src/flows/driver/driver-flow.integration.test.ts` — process.env×24, process.cwd×5, process.chdir×10
- `packages/siegelense/src/flows/install/install-flow.integration.test.ts` — process.env×6
- `packages/siegelense/src/flows/install-finalize/install-finalize-flow.integration.test.ts` — process.env×2

### S29 — integration tests: capacity, cleanup, compare layer flows (env, stdout, cwd, chdir)
- `packages/siegelense/src/flows/siegelense/siegelense-capacity-layer-flow.integration.test.ts` — process.env×4, process.cwd, process.chdir×2, process.stdout×8
- `packages/siegelense/src/flows/siegelense/siegelense-cleanup-layer-flow.integration.test.ts` — process.stdout×8
- `packages/siegelense/src/flows/siegelense/siegelense-compare-layer-flow.integration.test.ts` — process.stdout×8

### S30 — integration tests: docs, kill, recipes, results layer flows (stdout)
- `packages/siegelense/src/flows/siegelense/siegelense-docs-layer-flow.integration.test.ts` — process.stdout×16
- `packages/siegelense/src/flows/siegelense/siegelense-kill-layer-flow.integration.test.ts` — process.stdout×8
- `packages/siegelense/src/flows/siegelense/siegelense-recipes-layer-flow.integration.test.ts` — process.stdout×12
- `packages/siegelense/src/flows/siegelense/siegelense-results-layer-flow.integration.test.ts` — process.stdout×64

### S31 — integration tests: prune, run, snapshots, status layer flows (env, stdout)
- `packages/siegelense/src/flows/siegelense/siegelense-prune-layer-flow.integration.test.ts` — process.env×4, process.stdout×24
- `packages/siegelense/src/flows/siegelense/siegelense-run-layer-flow.integration.test.ts` — process.env×4
- `packages/siegelense/src/flows/siegelense/siegelense-snapshots-layer-flow.integration.test.ts` — process.env×4, process.stdout×40
- `packages/siegelense/src/flows/siegelense/siegelense-status-layer-flow.integration.test.ts` — process.env×4, process.stdout×36

### S32 — integration test: siegelense-flow (env, 52 stdout uses)
- `packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts` — process.env×4, process.stdout×52

### S33 — integration tests: startup (env, stdout)
- `packages/siegelense/src/startup/start-install.integration.test.ts` — process.env×14
- `packages/siegelense/src/startup/start-siegelense-driver.integration.test.ts` — process.env×4
- `packages/siegelense/src/startup/start-siegelense.integration.test.ts` — process.env×4, process.stdout×4

## Zod sweep (mechanical: change the specifier to '#gateway/npm/zod', nothing else)

199 files, all under packages/siegelense/src (contracts, plus four broker proxies and a set of stubs). Proposed: run last as chunks of about 25 files by folder, in the order listed in tmp/a18-siegelense-zod.txt. The operator's 2-4 file rule is mechanical-sweep-exempt only if the operator says so; otherwise 50 batches.
