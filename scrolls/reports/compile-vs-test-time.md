# Compile time vs test time in ward's jest runs

**Question.** Does TypeScript compilation make innocent test files look slow in ward's slow-file list?

**Answer: yes, and worse than the claim.** Compile is 74-79% of a cold jest run. It lands on whichever
suite first pulls each module, so ranking files by wall time ranks them by run position. A second
mechanism, not previously known, puts compile time inside jest's own per-test durations — so ward's
`testMs`, the number meant to clear a file, can convict it instead.

Harness: `tmp/compile-split/` in the `compile-vs-test-time` worktree — four small files, listed under
"Re-running this" below. `tmp/` is gitignored, so the harness dies with the worktree; move it into a
package if any of this is to be kept. Raw jest reports and timing JSONL live in this session's
scratchpad.

---

## How the split was measured

Ward's report gives two numbers per file: `durationMs` (jest's `endTime - startTime` for the suite)
and `testMs` (jest's summed assertion durations). Neither one measures compile. So the experiment
measures compile directly and treats the other two as given.

| Piece | Where the number comes from |
|---|---|
| `wall` | jest's own JSON report, `endTime - startTime` per suite — the number ward ranks on today |
| `compile` | a transformer that wraps ts-jest and times every `process()` call, to a JSONL file |
| `tests` | jest's own JSON report, summed `assertionResults[].duration` — ward's `testMs` |
| `rest` | `wall - compile - tests`. Module evaluation, jest environment setup and teardown. |

**Why wrapping `process()` is the right place to measure.** ts-jest builds its LanguageService and
TypeScript program lazily, on the first `process()` call. So that call's duration *is* the
package-wide compile cost, and the file it names is whichever file jest happened to transform first.
Timing the transformer's construction instead would measure nothing — it returns in under a
millisecond.

**Attribution.** A jest environment is constructed in the process that will run the suite, so a
custom environment stamps `suite-start` and `suite-end` with its pid and test path. Each compile is
then charged to whatever suite its own process had open. This is the only attribution that survives
worker mode, where several suites run at the same moment and a bare timestamp names no one. Checked
against a simpler timestamp-window method on an in-band run: same 798 files, same 5.5s, for the same
suite.

Every run uses the target package's own `jest.config.cjs` with one edit — the `ts-jest` entry in
`transform` swapped for the wrapper, keeping that entry's options byte-for-byte. A hand-built config
would measure a setup ward never runs.

`npx jest` is used directly here rather than `npm run ward`, because the point is to instrument the
jest process. This is an experiment, not a check.

---

## Result 1 — compile is three quarters of a cold run

`packages/mcp`, 176 unit suites, `--runInBand`. Elapsed is the clock; the rest are summed across
suites.

| Run | Elapsed | Summed wall | Compile | Tests | Rest |
|---|---|---|---|---|---|
| A — cold cache, jest's order | 147.2s | 144.8s | **107.9s (75%)** | 11.9s | 25.0s |
| B — cold cache, order reversed | 140.9s | 138.7s | **102.8s (74%)** | 19.1s | 16.8s |
| C — warm cache, jest's order | 24.4s | 23.1s | **0.0s** | 8.3s | 14.9s |

The warm run compiled zero files: jest served every one from its disk cache and never called
`process()` at all. Cold to warm is 147.2s to 24.4s on identical tests.

`packages/ward` itself, 161 unit suites, `--maxWorkers=25%` — ward's real invocation:

| Run | Elapsed | Summed wall | Compile | Tests | Rest |
|---|---|---|---|---|---|
| Cold cache | 41.5s | 108.7s | **85.9s (79%)** | 7.4s | 16.6s |
| Warm cache | 13.5s | 24.5s | **0.0s** | 8.5s | 16.0s |

`packages/mcp` in worker mode lands in the same place: 86.0s compile out of 108.6s summed wall, 79%.

---

## Result 2 — the wall-time crown follows run position, not the file

The same mcp file, across the three runs. Nothing about the file changed.

| Run | Its position | Wall | Compile | Tests |
|---|---|---|---|---|
| A — cold, jest's order | 1st of 176 | **30.6s** | 24.5s | 0.2s |
| B — cold, order reversed | 176th of 176 | **1.9s** | 1.4s | 0.3s |
| C — warm cache | 1st of 176 | **1.1s** | 0.0s | 0.1s |

`quest-handle-responder.test.ts` reads 30.6s in one run and 1.9s in the next. It compiled 1516 files
on the package's behalf in run A and 3 in run B. Its test bodies cost 0.2s every time.

Of ward's top twelve slow files for this package, eleven behave this way. One does not:

| File | Cold, jest order | Cold, reversed | Warm |
|---|---|---|---|
| `resolve-caller-session-layer-responder.test.ts` | 3.5s wall, **2.9s tests** | 3.5s wall, **2.9s tests** | 3.0s wall, **2.9s tests** |
| `quest-handle-responder.test.ts` | 30.6s wall, 0.2s tests | 1.9s wall, 0.3s tests | 1.1s wall, 0.1s tests |
| `header-info-contract.test.ts` | 1.2s wall, 0.0s tests | 0.4s wall, 0.1s tests | 0.1s wall, 0.0s tests |

Ranking by wall time puts the innocent file at the top and buries the real one at #2.

**The refinement to what ward's note says.** The note reads "charged to whichever file ran first".
The compile of each module is charged to the first suite that *requires* it, which is usually but not
always the first suite in the run. In run B the biggest bill — 21.0s, 934 files — went to the suite
in **28th** position, the first one to reach the orchestrator subtree. The first suite paid 6.4s.

In worker mode each worker pays its own bill, because jest's disk cache is written after the compile,
not before. Three workers compiled 2833 files between them where one in-band process compiled 1918
distinct files; 915 files were compiled twice or more, concurrently, before any cache entry existed.

| Worker | Suites it ran | Files it compiled | Its compile time | Its first suite |
|---|---|---|---|---|
| 1777166 | 55 | 1324 | 29.8s | `quest-handle-responder.test.ts` |
| 1777167 | 60 | 860 | 29.8s | `file-scanner-broker.test.ts` |
| 1777168 | 61 | 649 | 26.4s | `architecture-testing-patterns-broker.test.ts` |

Each of those three first-suites sits in ward's slow-file list. All three are first-in-worker.

---

## Result 3 — `testMs` is not compile-free either

This one is new, and it defeats the check ward's summary tells readers to make.

`claude-session-scan-statics.test.ts` is one assertion comparing an object with two numbers. Run
alone, cold:

```
wall 6.7s = compile 4.1s + tests 4.4s + rest -1.9s     482 files compiled
```

Ward would print `6.7s wall, 4.4s in tests`. A narrow gap, so by ward's own note the reader concludes
the file is genuinely slow. It is not.

**The mechanism.** `packages/testing/src/jest.setup.js` has a global `afterEach` that requires the
integration-cleanup broker lazily, inside the hook body. Jest's per-test `duration` runs from
`test_start` to `test_done`, which brackets `beforeEach` and `afterEach` — so on a cold cache the
compile of that whole graph is billed as test time.

**The proof.** Same file, same cold cache, one change: that `require` moved to module scope in
`jest.setup.js`. Same work, same moment in the process's life, only the hook it sits in changed.

| `jest.setup.js` | Wall | Compile | Tests |
|---|---|---|---|
| require inside `afterEach`, as shipped | 6.7s | 4.1s | **4.4s** |
| same require hoisted to module scope | 6.7s | 4.3s | **0.0s** |

Wall is identical. "Tests" goes from 4.4s to zero. The negative remainder — compile and tests both
claiming the same seconds — disappears with it.

The same signature shows up inside full runs: in the reversed mcp run this file sat first and read
6.8s of "test" time; in the other two runs, 0.0s. In worker mode
`architecture-testing-patterns-broker.test.ts` reads 4.4s tests against 4.3s compile in a 5.3s suite.

The edit was reverted. It is a reporting fix, not a speed fix — it moves the cost out of the number
that is supposed to exonerate a file.

---

## Result 4 — with compile gone, module evaluation is what is left

The warm `packages/ward` run: 24.5s summed wall, of which test bodies are 8.5s and `rest` is 16.0s.
The cold run's `rest` was 16.6s — unchanged. Module evaluation costs the same warm or cold, and once
the compile is cached it is the largest slice of a jest run, twice the test bodies.

So "compile" is the right answer to the question asked, and it is not the whole cost. A cold run is
roughly: three quarters compile, one sixth module evaluation, one fourteenth actual tests.

---

## What this means for ward

1. **Ranking slow files by wall time is measuring run position.** Eleven of the top twelve mcp
   entries move by an order of magnitude when the order changes.

2. **Ranking by `testMs` is better and is not yet safe.** It names the real culprit,
   `resolve-caller-session-layer-responder.test.ts`, first in two of the three runs. In the third it
   comes second, beaten by `claude-session-scan-statics.test.ts` — the one-assertion file whose 6.8s
   is compile charged through the `afterEach` hook. Fix the hook first, then rank on `testMs`.

3. **The note under the slow-file list is not safe as written.** A wide gap does mean the file is
   innocent. A narrow gap does **not** mean it is guilty, because the global `afterEach` can put
   compile inside `testMs`. Hoisting that `require` in `jest.setup.js` closes the hole and costs
   nothing.

4. **Ward can measure compile directly for about fifty lines.** `tmp/compile-split/timing-transformer.js`
   is the whole mechanism. Every package's config already routes its `ts-jest` options through the
   shared base config, so one wrapper exported from `@dungeonmaster/testing` would give
   `FileTiming` a real `compileMs` and let the summary print three numbers that add up instead of two
   that do not.

5. **A cold cache costs mcp 123 seconds and ward 28.** Whatever else changes, a run whose jest cache
   survives is worth several minutes across the repo.

## Re-running this

| File in `tmp/compile-split/` | What it does |
|---|---|
| `timing-transformer.js` | wraps ts-jest, times every compile into a JSONL file |
| `timing-environment.js` | stamps suite start and end with pid and test path |
| `reverse-sequencer.js` | runs the suites in the exact reverse of jest's order |
| `jest.config.js` | the target package's own config with the transform and environment swapped |
| `run-package.sh` | the three in-band runs: cold, cold-reversed, warm |
| `analyze.js` | joins a jest report with the JSONL and prints the split |
| `compare.js` | puts one suite's numbers from all three runs side by side |

```bash
bash tmp/compile-split/run-package.sh <package> <out-dir>
DM_ANALYSIS_JSON=<out-dir>/a-analysis.json \
  node tmp/compile-split/analyze.js <out-dir>/a-report.json <out-dir>/a.jsonl "label"
node tmp/compile-split/compare.js <out-dir>
```

`compare.js` reads the `DM_ANALYSIS_JSON` files, so run `analyze.js` with that variable set for all
three tags first. For a worker-mode run, call jest directly with `--maxWorkers=25%` and the same
`--config`; `analyze.js` switches to pid-based attribution on its own.
