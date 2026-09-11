# Handoff: the sweep ran, the baseline is green, and here is what is left

Branch `clean-test-baseline`, in the worktree of the same name. The sweep has been run and
triaged. Both gates pass:

```
npm run ward                       # 5 checks, 14 packages, exit 0
npm run ward -- --committed --uncommitted   # exit 0
```

| Check | Files | Result |
|---|---|---|
| lint | 7,758 | PASS |
| typecheck | 7,736 | PASS |
| unit | 2,726 | PASS |
| integration | 126 | PASS |
| e2e | 111 | PASS |

No slow files, no open handles, no discovery mismatches.

## What the sweep found

**Not one test failure, lint error or typecheck error in the whole repo.** Every finding across
232 sweep jobs was a slow file, a leaked handle, or a discovery alarm. Two of the four were
defects in the INSTRUMENT rather than in the code it was grading.

### The instrument was wrong twice before its numbers meant anything

**Ward's integration check was running unit tests.** `--findRelatedTests` replaces jest's
test-path filter, so `--testPathPatterns` stopped applying the moment a file-scoped run added
it. A three-path scope holding no integration test at all ran three unit suites under the
integration check's name. Every unit finding was reported twice, once against the wrong check,
and every scope paid for its unit tests twice.

**A skipped check read as a discovery mismatch.** A skip carries its package's discovery count
while processing nothing, so comparing the two across one reddened whole batches over a check
that correctly declined to run.

### The four leak causes

| Cause | Hits |
|---|---|
| `rateLimitsWatchBroker` interval, never unref'd | 38 |
| `child-process-spawn-stream-json-adapter.proxy.ts` immediate per mock child | 18 |
| `ward-runner.harness.ts` 600s safety-kill timeout | 12 |
| `server-init-responder.ts` 100ms flush loop | 12 |
| `hook-persistent-runner.harness.ts` 5s kill fallback | 7 |
| web e2e network recorder reading bodies fire-and-forget | 6 |
| `image-overlay` (Mantine's own `useFocusTrap`) and the websocket reconnect timer | 10 |

### Two real races the whole-check runs caught that the batches did not

**The rate-limits poller emitted one change as two events.** Its tick awaits a file read and
only compares against `lastJson` once that resolves, so two overlapping ticks both read the
content as new. A 5s production cadence and a sub-millisecond local read hide it; a loaded
machine does not.

**The websocket reconnect timer could not be cancelled.** `onClose` armed a 3000ms backoff and
then discarded its own handle, so a reconnect reached any other way left a live OS timer that
`disconnect()` had nothing to clear.

### What made things fast

| Change | Effect |
|---|---|
| `eslint.config.js` loads through `tsx/cjs`, not `ts-node/register` | config load per child 8.3s to 1.7s |
| `userEvent` gets `delay: null` from a shared static | 4.9ms per click and 2.0ms per character, across 59 call sites |
| `mockStagedBestMatchTransformer` scores each candidate once | shared by all 2,726 test files |
| the hooks harness launches tsx directly, not through `npx` | two fewer process launches per spawn |
| `typescript-source-file-getter-adapter.test.ts` builds its program with `types: []` | 627ms to 130ms |

## Read this before you touch ward's slow-file gate

**It reads the SLOWEST SINGLE TEST, not the suite total.** A sum grades a file on how many
tests it holds: one web suite is 153 tests at about 18ms each, so it tripped a one-second bar
while holding nothing slower than 165ms — and the cheapest way to pass a bar like that is to
delete tests. Across the thirteen slowest unit files the worst single test measured 413ms.
Switching the metric took unit from twenty flagged files to zero and integration from sixteen
to nine, with no allowance needed for any unit file.

**A jest timeout does not cover this.** A timeout catches a test that HANGS. A test sitting at
4.9s under a 5s timeout passes silently forever, and no timeout can be tightened to
"suspiciously slow" without failing legitimate work.

**Every bar is calibrated on the whole repo now, and the calibrations are in
`slowFileThresholdStatics` beside each number.** The e2e bar in particular — which the previous
handoff called the weakest number here — now rests on all 110 specs and 440 tests, where the
median spec's worst test runs 0.53s and exactly one spec holds a test over five seconds.

## What is left

### 1. The allowance list ships this repo's own file paths

`slowFileThresholdStatics.allowed` names `packages/hooks/...`, `packages/mcp/...`,
`packages/cli/...`. **Ward is published.** A consumer who installs dungeonmaster gets ward
carrying an allowance list for dungeonmaster's own test files. One entry already had to be
keyed package-relative because `no-hardcoded-package-name` refused the frontend package by
name, which is the same problem showing through.

The right home is `.dungeonmaster.json`, which ward already reads — `multiPackageLayerBroker`
resolves `ward.concurrency` through `configResolveBroker` today. The threading is contained:
both entry points into the gate (`hasSlowFilesGuard` and `resultToSummaryTransformer`) take a
whole `WardResult`, and only `commandRunBroker` calls the guard. It needs a field on
`dungeonmasterConfigContract`, which is a published contract, so it is a decision rather than a
tidy-up.

### 2. Every hook costs about a second of real session latency

Measured: `start-pre-bash-hook`, which lints nothing, still costs **0.97s per child** — node
boot plus the `@dungeonmaster/shared` module graph, 477 modules. The pre-edit lint hook costs
about **4s on every Edit and Write**, of which roughly 1.0s is that floor, 1.7s the eslint
config and 1.3s the actual linting.

That is latency a user feels in the editor, not test overhead. Splitting the `shared` barrels
so a hook pulls only what it needs is the lever, and it would drop the slowest integration
tests as a side effect.

### 3. Slow-file numbers move with machine load

Ward runs four packages at once, each with `--maxWorkers=25%` — the whole machine twice over.
The same test measured 11.9s in a whole-check run, 18.3s for its package alone under the old
sum metric, and 4.0s running its file by itself. Two back-to-back whole-check runs spread 10%
to 35%. Every threshold and allowance carries headroom for that, which means the gate catches a
test that DOUBLES rather than one that drifts. Lowering ward's own concurrency would sharpen it
at the cost of a longer whole-repo run; nobody has measured that trade.

## Two traps worth not re-discovering

**The two leak detectors do not nest, and the sweep only runs one of them.** Jest's own
collector waits about 30ms plus a garbage-collection cycle before it looks, so a fast-firing
`setImmediate` settles on its own and is never reported. `@dungeonmaster/testing`'s timer
watcher — the WORKER-branch detector, which a file-scoped sweep never reaches — checks at each
file's teardown with no grace period and catches exactly those. The 18 immediates in the spawn
proxy were reported clean by every sweep batch and in full by one `--only unit` run. Triage the
sweep AND a whole-check run of each type.

**Jest colours its "No tests found" banner even under `--no-color`.** A line-anchored match
never fires against it, which made eight packages report `(crash) No tests found` where the
honest answer was a skip. `scrolls/tools/ward-sweep.py` carries the first trap in its own
header; this one lives in `isNoTestsFoundGuard`.

**Playwright's own timers still look exactly like leaks**, and the fixture ORDER is what
settles it: `_openHandleWatch` is declared first so it tears down last, because Playwright
reverses setup order and the watch was otherwise sampling before the network dump had drained.
