# Handoff: the sweep is done, the gate is not. Read the two rules first.

The sweep ran, was triaged, and merged to master (`1f226e64a`, 21 commits, 152 files). The
branch `clean-test-baseline` is merged and its worktree is removed.

Four of the five checks are clean and stay clean. **The slow-test gate is the unfinished part**,
and the last session took it the wrong way twice. Read the two rules below before touching it.

## THE TWO RULES

### 1. Time the TEST RUN, never the compile

The slow-test number must not include compile time. This repo already applies that rule one
level up — `durationMs` is jest wall time and carries the package's one-time compile, `testMs`
is the test bodies alone, and the whole slow-file report exists because wall time accused the
wrong file.

**The same misattribution recurs one level down and is NOT yet fixed.** A test that spawns a
child process pays that child's transpile INSIDE its own
`assertionResults[].duration`, so jest hands ward a number with compile baked into it. Every
file on the outstanding list below is a file whose tests spawn children. That is the bug to
fix. Fix the measurement.

### 2. Tests run against SOURCE, and that stays

Do not point a test at `dist` to make a number go down. `jest.config.base.js` sets
`customExportConditions: ['source', ...]` and the hooks harness spawns with
`--conditions=source` on purpose: a suite that reads compiled output goes green over a stale
build. **A test compiling in order to run against source is correct and must stay.**

The last session measured `node dist/src/startup/start-pre-edit-hook.js` at 0.22s against 0.73s
for `node --import tsx src/startup/start-pre-edit-hook.ts`, and proposed switching. That is the
wrong trade and was rejected. The measurement is recorded here only so nobody re-runs it and
reaches the same wrong conclusion: **the 0.5s difference is compile, which is exactly the thing
rule 1 says not to charge to the test.**

### And no per-file allow list

It was built, it was wrong, and it is gone. Two reasons, either sufficient:

- It hardcoded this repo's test paths into `slowFileThresholdStatics`, and
  `@dungeonmaster/ward` is a PUBLISHED package that ships `dist/`. Every consumer would have
  received a list of paths meaningless in their repo. `no-hardcoded-package-name` caught one
  entry, which was the rule showing through from one side.
- It excuses the symptom instead of fixing rule 1.

## What is outstanding

`npm run ward -- --only integration` currently exits 1. Six files, every one of them spawning
real child processes:

| slowest test | file | tests |
|---|---|---|
| 9.2s | `hooks` start-pre-edit-hook | 32 |
| 7.2s | `hooks` start-post-edit-hook | 11 |
| 7.2s | `ward` start-ward | 5 |
| 5.8s | `mcp` start-mcp-server | 1 |
| 3.9s | `orchestrator` spawn-stream-json adapter | 2 |
| 3.2s | `cli` cli-entry | 5 |

Plus one e2e spec, `packages/web/src/flows/quest-chat/send-images-chat-route.e2e.ts`, whose
worst test measured 7.8s. That one may be genuine rather than compile: it sends images
deliberately large enough for an upload progress bar to paint and climb from 0 to 100, so the
transfer time is what the test observes. Check it against rule 1 before assuming either way.

`npm run ward -- --committed --uncommitted` passed at the point of merge. Re-run it after any
change here.

## Numbers you will want, so you do not re-measure them

**A spawned child's cost, warm, same hook and input back to back.** This is the compile that
rule 1 says to stop charging to the test:

| | tsx over source | plain node over compiled |
|---|---|---|
| `start-pre-bash-hook` (lints nothing) | 0.55s | 0.14s |
| `start-pre-edit-hook` | 0.73s | 0.22s |

**Inside a child, once:** `require(eslint.config.js)` costs 1.7s warm — it was 8.3s before that
config moved from `ts-node/register` to `tsx/cjs`, which is committed. Of that, the
`@dungeonmaster/eslint-plugin` source require is 1.5s.

**The `@dungeonmaster/shared` barrel pulls 477 modules into every hook child**, and 675 into
some. That is the floor under every spawn, and it is real session latency too, not just test
cost — a user waits for it on every Edit and Write.

**Contention moves everything.** Ward runs four packages at once, each with
`--maxWorkers=25%` — the whole machine twice over. `start-pre-edit-hook`'s worst test read
11.9s in a whole-check run, 9.2s in an integration-only run, and 4.0s running that file alone.
Any number you set against a full run is measuring the machine as much as the code.

## What the gate reads now, and why

`slowFileTimingsTransformer` ranks and filters on **`slowestTestMs`** — the worst single test in
a file — not the suite total.

A sum grades a file on how many tests it holds. One web suite is 153 tests at about 18ms each,
so it tripped a one-second bar while holding nothing slower than 165ms, and the cheapest way to
pass a bar like that is to delete tests. Across the thirteen slowest unit files the worst single
test measured 413ms. Switching the metric took unit from twenty flagged files to **zero** across
2,726, and integration from sixteen to nine.

A jest timeout does not cover this. A timeout catches a test that HANGS; a test sitting at 4.9s
under a 5s timeout passes silently forever, and no timeout can be tightened to "suspiciously
slow" without failing legitimate work.

The bars, all calibrated on the whole repo, with the measurement written beside each one in
`slowFileThresholdStatics`:

| bar | value | measured basis |
|---|---|---|
| `testWarnMs` | 1000 ms | 2,726 unit files, worst single test anywhere 413ms |
| `integrationTestWarnMs` | 3000 ms | 126 files, 110 finish under one second |
| `e2eTestWarnMs` | 5000 ms | 110 specs, 440 tests, median spec's worst test 0.53s |
| `lintRulesWarnMs` | 2000 ms | 7,758 files, median 14ms, p99 219ms, worst 1148ms |
| `warnMs` | 5000 ms | wall-time fallback, used only where no per-file breakdown exists |

## What the sweep found, and what was fixed

**Not one test failure, lint error or typecheck error in the whole repo**, across 232 sweep
jobs. Every finding was a slow file, a leaked handle, or a discovery alarm — and two of the
four causes were defects in the INSTRUMENT rather than in the code it graded.

### Instrument defects, both fixed

- **Ward's integration check ran unit tests.** `--findRelatedTests` replaces jest's test-path
  filter, so `--testPathPatterns` stopped applying the moment a file-scoped run added it. Every
  unit finding was reported twice, once against the wrong check.
- **A skipped check read as a discovery mismatch**, reddening whole batches over a check that
  correctly declined to run.

### Leaks, all fixed

| cause | hits |
|---|---|
| `rateLimitsWatchBroker` interval never unref'd | 38 |
| spawn-stream-json proxy, an immediate per mock child | 18 |
| `ward-runner.harness.ts` 600s safety-kill timeout | 12 |
| `server-init-responder.ts` 100ms flush loop | 12 |
| `hook-persistent-runner.harness.ts` 5s kill fallback | 7 |
| web e2e network recorder reading bodies fire-and-forget | 6 |
| Mantine's `useFocusTrap`, and the websocket reconnect timer | 10 |

### Two real races the whole-check runs caught and the file-scoped batches did not

- **The rate-limits poller emitted one change as two events.** Its tick awaits a file read and
  only compares against `lastJson` once that resolves, so two overlapping ticks both read the
  content as new.
- **The websocket reconnect timer could not be cancelled.** `onClose` armed a 3000ms backoff
  then discarded its own handle, so `disconnect()` had nothing to clear.

### Speed-ups that landed

| change | effect |
|---|---|
| `eslint.config.js` loads through `tsx/cjs`, not `ts-node/register` | config load per child 8.3s to 1.7s |
| `userEvent` gets `delay: null` from a shared static | 4.9ms per click, 2.0ms per character, 59 call sites |
| `mockStagedBestMatchTransformer` scores each candidate once | shared by all 2,726 test files |
| hooks harness launches tsx directly, not through `npx` | two fewer process launches per spawn |
| `typescript-source-file-getter-adapter.test.ts` builds with `types: []` | 627ms to 130ms |

## Three traps worth not re-discovering

**The two leak detectors do not nest, and a file-scoped sweep only runs one.** Jest's own
collector waits about 30ms plus a garbage-collection cycle before it looks, so a fast-firing
`setImmediate` settles on its own and is never reported. `@dungeonmaster/testing`'s timer
watcher — the WORKER-branch detector — checks at each file's teardown with no grace period and
catches exactly those. The 18 immediates in the spawn proxy were reported clean by every sweep
batch and in full by one `--only unit` run. Triage the sweep AND a whole-check run of each type.
`scrolls/tools/ward-sweep.py` carries this in its own header.

**Jest colours its "No tests found" banner even under `--no-color`.** A line-anchored match
never fires against it, which made eight packages report `(crash) No tests found` where the
honest answer was a skip. Fixed in `isNoTestsFoundGuard`; the shape is worth remembering.

**Playwright's own timers look exactly like leaks**, and fixture ORDER settles it:
`_openHandleWatch` is declared first so it tears down last, because Playwright reverses setup
order and the watch was otherwise sampling before the network dump had drained.
