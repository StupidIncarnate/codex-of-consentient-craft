# Handoff: run the sweep, triage what it finds, merge a clean baseline

Everything below is committed on branch `clean-test-baseline`, in the worktree of the same name.
The tooling is finished and verified. **The sweep itself has not been run** — that is the next
session's job.

## Run this

```bash
cd worktrees/clean-test-baseline
python3 scrolls/tools/ward-sweep.py <out-dir>
```

7,702 files. 14 typecheck jobs, 193 batches of 40, 23 e2e batches of 5. Roughly 45-90 minutes at
the default 4 non-e2e jobs and 2 e2e jobs. It writes as it goes, so a killed run keeps everything
it already found:

| File | What is in it |
|---|---|
| `<out-dir>/progress.jsonl` | every job — command, exit code, run id, seconds, reasons |
| `<out-dir>/findings.jsonl` | only the jobs with something to report, whole |
| `<out-dir>/report.md` | the same, rendered, with each job's `ward detail` inline |
| `<out-dir>/logs/<id>.log` | the raw ward output |
| `<out-dir>/logs/<id>.detail.log` | the whole `ward detail <runId>` |

`--limit N` runs the first N jobs, `--packages a,b` narrows to packages,
`--only-kinds typecheck,batch,e2e` narrows to job kinds.

**Batches, not one full run, because a file-scoped ward run takes jest's IN-BAND branch.** That
branch carries `--detectOpenHandles`, which sees sockets, child processes and file watchers — not
only the timers a worker run can catch. A full run cannot have that: `shouldRunInBand` in
`@jest/core` reads `if (runInBand || detectOpenHandles) return true`, so asking for it
single-threads the whole repo. The sweep therefore finds strictly more than `npm run ward` does.

## Then

1. Triage `report.md`. Every record carries the exact command, so a fix can be re-checked by
   re-running one string.
2. Fix, then `npm run ward -- --uncommitted` over what you touched.
3. One bare `npm run ward` as the regression pass.
4. Merge to master.

## What already changed, and what it means for the sweep's output

**A slow suite and a leaked handle now FAIL a run.** They never did before — jest exits 0 on both —
so the repo has an unknown number of each, standing. Expect the first sweep to be noisy for reasons
that are real rather than tooling faults.

Three baseline defects are already known, found while building this:

| Where | What |
|---|---|
| `packages/orchestrator/.../child-process-spawn-stream-json-adapter.proxy.ts:98` | arms a `setImmediate` per mock child process and never clears it — 18 leaks in one suite |
| `packages/ward/test/harnesses/ward-runner/ward-runner.harness.ts:125` | leaves a `setTimeout` armed after `start-ward.integration.test.ts` |
| `packages/shared/.../process-cwd-adapter.ts` | a PIPEWRAP that outlives several ward suites |

**Slow-file ranking changed from wall time to test-body time.** Wall spans the package's one-time
compile and its module evaluation, both charged to whichever suite reaches a module first — one mcp
file read 30.6s running first and 1.9s running last, the same tests either way. See
`scrolls/reports/compile-vs-test-time.md` for the measurements.

**Two thresholds, in `slowFileThresholdStatics`.** `testWarnMs` is 1s for jest, calibrated on two
packages warm where one suite of 176 exceeded it. `e2eTestWarnMs` is 5s for browser specs,
calibrated on FIVE specs that summed 0.2s to 1.4s each. **That second number is the weakest thing
here** — revisit it once the sweep has reported all 111.

**`isolatedModules` is on** (merged from `isolated-modules-experiment`). `--only unit` alone no
longer type-checks; ward's `typecheck` still grades every test file. See
`scrolls/isolated-modules-handoff.md`.

## Two traps worth not re-discovering

**A require at setup-file scope breaks every test that mocks anything in its graph.** A setup file
runs before the test file body, so its modules resolve before the transformer's hoisted
`jest.mock()` calls run, and the mocks then apply to nobody. That is why `jest.setup.js` loads the
cleanup broker in `beforeAll` — outside jest's measured window AND inside the mocked registry.

**Playwright's own timers look exactly like leaks.** A clean five-spec batch reported 74 findings
before the three filters in `openHandleStatics.report` were right: both extensions of the watch
adapter's own frame, `node:` rather than `node:internal`, and dropping any frame with no
`line:column`. If e2e leak reports ever flood again, that is the first place to look.
