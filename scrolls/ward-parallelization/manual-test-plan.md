# Ward parallelization: manual test plan

Status: draft, 2026-10-02. Tests the plan in `scrolls/ward-parallelization-and-load-balancer.md` (called "the plan"
below). Nothing here is built yet.

This plan is for a person, or an agent, driving the REAL ward against the REAL repo, a real consumer repo, and a real machine under real load. Written tests prove each piece; these cases look for what the pieces do together, and for the edge cases nobody wrote a test for. Several cases repeat a written test on purpose.

## Contents

| Section                                                                     | Area codes                                  |
|-----------------------------------------------------------------------------|---------------------------------------------|
| How to use this plan                                                        |                                             |
| Environments and baseline                                                   | ENV, BASE                                   |
| Unit N: Node floor and SQLite gateway                                       | NODE                                        |
| Unit A: shared queue, ordering, history                                     | POOL, HIST                                  |
| Unit B: e2e sharding                                                        | SHARD, CFG                                  |
| Unit D: load balancing                                                      | RES, REG, LEASE, GOV, SIG, SIEGE, PLAT, ISO |
| Unit S: disk budget                                                         | DISK                                        |
| Unit R: home config rename                                                  | REN                                         |
| Publish rehearsal                                                           | PUB                                         |
| Which cases gate which unit                                                 |                                             |
| Appendix A: helper scripts                                                  |                                             |
| Appendix B: edge cases this plan found, and where the plan now answers them |                                             |

## How to use this plan

### The verdict

Ward has no UI, so the verdict is what a ward user sees and what the machine shows:

1. **Ward's own output and exit
   code.** A case fails if the summary, `ward detail`, or `ward raw` says something untrue, even when the exit code is right.
2. **The process
   table.** A case fails if any process ward started (a child ward, Jest, ESLint, tsc, Playwright, Chromium, Vite, the API server) is still alive after ward exits. Use `wp-orphans.sh` (Appendix A).
3. **Ports.** A case fails if any port ward picked still has a listener after ward exits. Use `wp-ports.sh`.
4.
**Files.** History, registry and report files must be valid and in the right place. No stray file may appear in the repo (`git status --porcelain` is unchanged except where the case says).

The registry and its history rows explain a failure. They never pass a case on their own.

### Every case has

| Field              | Meaning                                                                                                                                                                                                                                                                                                                          |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ID                 | `WP-<AREA>-<n>`                                                                                                                                                                                                                                                                                                                  |
| Severity           | If it fails. `blocker`: a wrong verdict (red reported green or green reported red), a lost failure, an orphan process, a corrupt file, a consumer that cannot install or run. `major`: a slowdown the plan promised to remove, a missing lease, a wrong order, a fallback that prints nothing. `minor`: wording, a cosmetic gap. |
| Automatable        | `unit`, `integration`, `manual-only`. Several can apply.                                                                                                                                                                                                                                                                         |
| Setup              | The environment, plus any exact commands.                                                                                                                                                                                                                                                                                        |
| Steps              | What to do, in order.                                                                                                                                                                                                                                                                                                            |
| Expect             | What you see when it works.                                                                                                                                                                                                                                                                                                      |
| Failure looks like | What you see when it does not. Left out when failure is simply anything other than Expect.                                                                                                                                                                                                                                       |

### Rules while testing

- Run every ward command from the repo root, with a 600000ms timeout.
- Do not edit source while a run is in flight. One save restarts the API server under `dev` and fails specs that are not broken (repo `CLAUDE.md`, "Test isolation").
- Start `wp-procs.sh` before any case that counts processes, and keep its CSV with the case result.
- A case that needs a deliberate break (a failing assertion, a garbage file) says how to undo it. Undo it before the next case, and confirm with `git status`.
- Record for every case: date, commit SHA, Node version, PASS or FAIL, and the evidence (command output tail, CSV, file listing).

## Environments and baseline

### Environments

| ID           | What                                                          | How to set it up                                                                                                                                                    |
|--------------|---------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ENV-MAIN     | This repo's main checkout, at the commit under test           | `git log -1` names the commit                                                                                                                                       |
| ENV-WT       | A second checkout of the same repo                            | `mcp__dungeonmaster__create-worktree({ name: 'wp-mt-2' })`                                                                                                          |
| ENV-CONS     | A fresh consumer repo, installed from packed tarballs         | `npm run build:clean && npm run check:consumer -- --mode=local --keep`. The script prints the kept directory.                                                       |
| ENV-GLOBAL   | A consumer using only a global install                        | `npm run check:consumer -- --mode=global --keep`                                                                                                                    |
| ENV-NODE21   | Node 21.6.0, which has no `node:sqlite`                       | `source ~/.nvm/nvm.sh && nvm use 21.6.0` in that shell only                                                                                                         |
| ENV-NODE2215 | Node 22.15.0, which has `node:sqlite` but no busy-wait option | `nvm install 22.15.0 && nvm use 22.15.0`                                                                                                                            |
| ENV-NODE24   | Node 24, the newer line                                       | `nvm install 24 && nvm use 24`                                                                                                                                      |
| ENV-BURN     | CPU fully busy                                                | `node tmp/wp-burn.mjs 12` (Appendix A). Stop with Ctrl-C.                                                                                                           |
| ENV-HOG      | Memory nearly full                                            | `node tmp/wp-hog.mjs <MB>`, sized so `free -m` shows about 2000 MB available                                                                                        |
| ENV-CGROUP   | A container-sized slice of this machine                       | Prefix a command with `systemd-run --user --scope -p MemoryMax=4G -p CPUQuota=400%`. This machine runs cgroup v2 (`stat -fc %T /sys/fs/cgroup` prints `cgroup2fs`). |
| ENV-RES      | Machine limits set                                            | Edit `~/.dungeonmaster/config.json` and add a `resources` object. Back the file up first and restore it after the case.                                             |

This machine has 12 cores and 64 GB of memory. Record the same for any other machine you test on.

### Baseline (do this first, on `master` before Unit A merges)

**WP-BASE-01 · Record today's behaviour.**

- Steps:
    1. On `master`, run `npm run ward` twice, one after the other. Keep both outputs.
    2. Run `npm run ward -- --only e2e -- packages/web` once. Keep the output.
    3. From each full run's summary, write down: total duration, the package order in the summary, every slow file named, and web's e2e duration.
- Expect: both runs exit 0. If they do not, stop: a red baseline makes every later comparison meaningless.
- Later cases compare against these numbers. Call them BASE-FULL, BASE-ORDER, BASE-SLOW and BASE-E2E.

---

## Unit N: Node floor and SQLite gateway

**WP-NODE-01 · `engines` says 22.16.**

- Severity: major · Automatable: unit
- Steps: read `engines.node` in the root `package.json`, `packages/@gateway/node/package.json` and (after D)
  `packages/load-balancer/package.json`.
- Expect: each reads `>=22.16.0`. No other package declares a different Node floor.

**WP-NODE-02 · npm warns on an older Node.**

- Severity: major · Automatable: manual-only
- Setup: ENV-NODE2215, a packed tarball of the root package (`npm pack` after `npm run build:clean`).
- Steps: in an empty folder under the OS `/tmp`, `npm init -y && npm install <tarball>`.
- Expect: npm prints an `EBADENGINE` warning naming `>=22.16.0`. With `npm install --engine-strict`, it refuses.

**WP-NODE-03 · Ward refuses Node 21 with a clear message.**

- Severity: blocker · Automatable: integration
- Setup: ENV-NODE21, after Unit D lands.
- Steps: `npm run ward -- --only lint -- packages/config`.
- Expect: ward stops before starting any child, prints one line naming Node 22.16 as the minimum and naming the running version, and exits non-zero. It prints the message once, not once per package.
- Failure looks like: `Cannot find module 'node:sqlite'`, `ERR_UNKNOWN_BUILTIN_MODULE`, a stack trace, or the message repeated per package.

**WP-NODE-04 · Ward refuses Node 22.15 the same way.**

- Severity: blocker · Automatable: integration
- Setup: ENV-NODE2215.
- Steps and Expect: as WP-NODE-03. 22.15 HAS `node:sqlite`, so this case catches a version check that only tests whether the module loads.

**WP-NODE-05 · No SQLite warning on Node 22.17.**

- Severity: major · Automatable: integration
- Setup: ENV-MAIN on 22.17, after D.
- Steps: `npm run ward -- --only lint -- packages/config 2>&1 | grep -c ExperimentalWarning`.
- Expect: `0`.

**WP-NODE-06 · Other warnings still print.**

- Severity: major · Automatable: unit
- Steps: `NODE_OPTIONS=--pending-deprecation npm run ward -- --only lint -- packages/config 2>&1 | grep -i
  DeprecationWarning`. If nothing in the run triggers one, run N2's unit test that passes a non-SQLite warning through and read its assertion.
- Expect: the filter drops only the SQLite experimental warning.
- Failure looks like: every warning gone. That hides real problems from every user.

**WP-NODE-07 · The warning filter is put back.**

- Severity: minor · Automatable: unit
- Steps: read N2's test that a throwing `node:sqlite` load still restores `process.emitWarning`.
- Expect: the test exists and asserts the original function is back.

**WP-NODE-08 · Node 24 runs the whole gate.**

- Severity: blocker · Automatable: manual-only
- Setup: ENV-NODE24, ENV-MAIN.
- Steps: a bare `npm run ward`, then WP-REG-01, WP-LEASE-01 and WP-GOV-01.
- Expect: the same results as on 22.17. `node:sqlite` is stable on 24, so it prints no warning either way.

**WP-NODE-09 · Busy wait works across processes.**

- Severity: blocker · Automatable: integration
- Steps: run `node tmp/wp-sqlite-contend.mjs 20` (Appendix A). It starts 20 processes that each open one database file through the gateway and insert 200 rows inside short transactions.
- Expect: every process exits 0, and the table holds exactly 4000 rows. No `SQLITE_BUSY` or `database is locked`.

---

## Unit A: shared queue, ordering, history

### POOL

**WP-POOL-01 · Web starts in the first wave.**

- Severity: major · Automatable: integration
- Setup: ENV-MAIN, history present (run one full ward first).
- Steps: start `wp-procs.sh`, then a bare `npm run ward`.
- Expect: the CSV's first sample with 4 child wards includes one whose cwd is `packages/web`.

**WP-POOL-02 · No worker idles while packages wait.**

- Severity: major · Automatable: integration
- Setup: as WP-POOL-01.
- Steps: read the CSV's child-ward count column across the run.
- Expect: the count stays at `ward.concurrency` (4 before D) until the queue is empty, then falls one by one. A dip below 4 for longer than one sample while packages are still queued is a failure.

**WP-POOL-03 · The summary order is unchanged.**

- Severity: major · Automatable: integration
- Steps: compare the package order in the full run's summary with BASE-ORDER.
- Expect: identical order for every check type.
- Failure looks like: web listed first because it was dispatched first.

**WP-POOL-04 · Full run time.**

- Severity: major · Automatable: manual-only
- Steps: two bare runs on an idle machine, the second with history from the first.
- Expect: the second run is under 600s, against BASE-FULL of about 980s. Record the figure.

**WP-POOL-05 · Concurrency 1 runs longest first, one at a time.** (Unit A gate only; Unit D removes `ward.concurrency`)

- Severity: minor · Automatable: integration
- Setup: set `ward.concurrency` to 1 in `.dungeonmaster.json` (undo afterwards).
- Steps: `npm run ward -- --only lint`.
- Expect: the CSV never shows more than 1 child ward, and the first child is the package with the longest lint history (orchestrator, per §2.1 of the plan).

**WP-POOL-06 · The order follows the check types asked for.**

- Severity: minor · Automatable: unit
- Steps: `npm run ward -- --only lint` with history present.
- Expect: the first wave holds the packages with the longest LINT history, not web (whose e2e time does not count here).

**WP-POOL-07 · The pool's other caller still works.**

- Severity: major · Automatable: integration
- Steps: run ward's scan subcommand over the repo (`npm run ward -- scan --help` names its arguments), then compare its report with the same scan on `master`.
- Expect: the same violations in the same order.

**WP-POOL-08 · A new package goes first.**

- Severity: minor · Automatable: unit
- Setup: ENV-WT. In it, `dungeonmaster create-package --name wp-probe --type library`.
- Steps: a bare `npm run ward` in the worktree.
- Expect: `wp-probe` is in the first wave. Delete the worktree afterwards.

### HIST

History is the registry's `durations` table (plan §3). `node tmp/wp-leases.mjs --durations` prints this repo's rows (Appendix A); `--durations-clear <repoRoot>` deletes them.

**WP-HIST-01 · A cold start works.**
- Severity: major · Automatable: integration
- Steps: `node tmp/wp-leases.mjs --durations-clear $PWD`, then a bare run, then `--durations`.
- Expect: the run passes; the first wave is the first 4 packages in discovery order; afterwards there is exactly one row per package and check type, each with `repo_root` equal to this checkout's path.

**WP-HIST-02 · One slow run does not reorder the next.**

- Severity: major · Automatable: unit
- Setup: at least 3 full runs' samples present.
- Steps: insert one sample for a small package's `lint` with a duration 20 times its median (`node tmp/wp-leases.mjs --durations-insert <package> lint <ms>`). Run `npm run ward -- --only lint`.
- Expect: that package is not in the first wave. The median ignores one outlier.

**WP-HIST-03 · An unusable registry does not redden the run.**

- Severity: blocker · Automatable: integration
- Steps: for each setup, run `npm run ward -- --only lint`, then undo it: `DUNGEONMASTER_LOAD_DIR` pointing at a regular file; the load folder at mode `500`; `registry-v1.db` replaced by 4 KB of random bytes.
- Expect: each run exits 0 with the normal summary, stderr holds exactly one line starting
  `ward: duration history unavailable:`, and the first wave is in discovery order.

**WP-HIST-04 · Five samples, no more.**

- Severity: major · Automatable: integration
- Steps: run `npm run ward -- --only lint -- packages/config` 7 times, then `--durations`.
- Expect: exactly 5 `lint` rows for `@dungeonmaster/config`, the newest 5 by `recorded_at_ms`.

**WP-HIST-05 · A worktree shares the main checkout's rows.**
- Severity: major · Automatable: integration
- Setup: ENV-WT.
- Steps: run `npm run ward -- --only lint` in the worktree, then `--durations` from ENV-MAIN.
- Expect: the new rows carry the MAIN checkout's path as `repo_root`, not the worktree's. The worktree's first wave matched the main checkout's lint predictions. No `.ward/history/` folder exists anywhere.

**WP-HIST-06 · Two runs finishing together both keep their samples.**
- Severity: blocker · Automatable: integration
- Setup: ENV-MAIN and ENV-WT, with fewer than 4 lint samples per package (clear first).
- Steps: start `npm run ward -- --only lint` in both within one second.
- Expect: both exit 0; every package gained exactly 2 lint rows; no `database is locked` and no `duration history
  unavailable` line.

**WP-HIST-07 · Which runs add samples.**
- Severity: major · Automatable: integration
- Steps: for each command below, count this repo's rows before and after.

| Command                                                                            | Expect                                                      |
|------------------------------------------------------------------------------------|-------------------------------------------------------------|
| `npm run ward -- --only unit -- packages/ward/src/statics/ttl/ttl-statics.test.ts` | no new rows                                                 |
| `npm run ward -- --only unit --onlyTests "ttl" -- packages/ward`                   | no new rows                                                 |
| `npm run ward -- --uncommitted` with one edited file                               | no new rows                                                 |
| `npm run ward -- -- packages/config`                                               | one new row per check type, all for `@dungeonmaster/config` |
| `npm run ward -- --only lint`                                                      | one new `lint` row per package                              |

**WP-HIST-08 · A crashed child adds nothing.**
- Severity: major · Automatable: integration
- Steps: start a bare run. When `wp-procs.sh` shows the `packages/shared` child ward, `kill -9` that child's pid.
- Expect: the run reports shared as crashed (as it does today) and exits with the crash code; shared gains no rows; every other package gains one row per check type.

**WP-HIST-09 · Ctrl-C adds nothing.**
- Severity: major · Automatable: manual-only
- Steps: start a bare run in a terminal and press Ctrl-C halfway. Repeat 3 times at different points.
- Expect: no new rows each time, and the registry opens cleanly afterwards.

**WP-HIST-10 · History outside git.**
- Severity: minor · Automatable: unit
- Setup: ENV-CONS with its `.git` folder moved aside (if the consumer check made one).
- Steps: `npx dungeonmaster ward -- --only lint`.
- Expect: the run passes and its rows carry the consumer root as `repo_root`.

**WP-HIST-11 · History when git is not on PATH.**
- Severity: minor · Automatable: unit
- Steps: make a folder holding only symlinks to `node` and `npm`, then run
  `env PATH=<that folder> npm run ward -- --only lint -- packages/config`.
- Expect: the run passes, keyed by the run root. If ward needs git for anything else on this path, record what failed. That is a pre-existing limit, not this plan's.

**WP-HIST-12 · A repo moved to a new path.**
- Severity: minor · Automatable: manual-only
- Setup: ENV-CONS kept.
- Steps: run `npx dungeonmaster ward -- --only lint` in the consumer, move its folder, run again.
- Expect: the second run dispatches in discovery order (no history at the new path) and passes; rows exist under both paths. Record how many rows the old path leaves behind.

**WP-HIST-13 · How large history gets.**

- Severity: minor · Automatable: manual-only
- Steps: count this repo's rows and the registry file size after 10 full runs. Then create, run and delete a probe package, as in WP-POOL-08.
- Expect: at most 5 rows per package and check type. The deleted package's rows remain; record the file size.

---

## Unit B: e2e sharding

### SHARD

**WP-SHARD-01 · A full sharded run passes.**

- Severity: blocker · Automatable: manual-only
- Setup: ENV-MAIN with `ward.e2eSharding: true` (this repo's setting). Before Unit D the count is 3.
- Steps: start `wp-procs.sh`, run `npm run ward -- --only e2e -- packages/web`, then `wp-ports.sh` and
  `wp-orphans.sh`.
- Expect: exit 0; the CSV shows 3 Playwright processes at once; 3 different `dm-e2e-<pid>` folders appear under the OS temp dir during the run; no listener and no orphan afterwards; the summary's e2e file count equals BASE-E2E's.

**WP-SHARD-02 · No new slow tests at 3 shards.**

- Severity: major · Automatable: manual-only
- Steps: compare the slow-file list of WP-SHARD-01 with BASE-SLOW. Then run it twice more.
- Expect: no e2e file is slow in 2 of the 3 runs that was not slow in the baseline.

**WP-SHARD-03 · How even the shards are.**

- Severity: minor · Automatable: manual-only
- Steps: from the CSV, read each Playwright process's start and end time.
- Expect: record all three wall clocks. If the slowest is more than 1.5 times the fastest, file the follow-up the plan names (split spec files by per-file history).

**WP-SHARD-04 · One spec starts one process with no shard flag.**

- Severity: major · Automatable: integration
- Steps: `npm run ward -- --only e2e -- <one .e2e.ts file>`, with `wp-procs.sh` recording full command lines.
- Expect: one Playwright process, with no `--shard` and no `--pass-with-no-tests` in its arguments.

**WP-SHARD-05 · Two specs start two processes.**

- Severity: minor · Automatable: integration
- Steps: as WP-SHARD-04 with two spec files.
- Expect: two processes, `--shard=1/2` and `--shard=2/2`.

**WP-SHARD-06 · `--onlyTests` uses one process.**

- Severity: major · Automatable: integration
- Steps: `npm run ward -- --only e2e --onlyTests "<a real test title>" -- packages/web`.
- Expect: one Playwright process; the matching test runs and passes; the run exits 0.

**WP-SHARD-07 · `--onlyTests` matching nothing.**

- Severity: major · Automatable: integration
- Steps: as WP-SHARD-06 with `--onlyTests "zzz-no-such-test"`.
- Expect: the same message and exit code as on `master` (`matched 0 tests in any package`).

**WP-SHARD-08 · A failure in one shard is reported whole.**

- Severity: blocker · Automatable: integration
- Steps: find a spec that lands in shard 2 (run WP-SHARD-01 with `wp-procs.sh` and read which files shard 2 printed). Change one `expect` in it to a wrong value. Run the full sharded e2e. Undo the change.
- Expect: exit 1; the summary names that file and test; `npm run ward -- detail <runId> <file>` shows the same message it shows on `master` for the same break; the other shards' passing tests are counted.

**WP-SHARD-09 · Failures in two shards at once.**

- Severity: blocker · Automatable: integration
- Steps: as WP-SHARD-08, breaking one spec in shard 1 and one in shard 3.
- Expect: both failures appear exactly once each.

**WP-SHARD-10 · A shard that crashes.**

- Severity: blocker · Automatable: manual-only
- Steps: start the full sharded e2e. When shard 2's Playwright process is running tests, `kill -9` it.
- Expect: the run fails and says so; `ward raw` shows shard 2's output under its `--- e2e shard 2/3 ---` header; shards 1 and 3 finish; no listener and no orphan afterwards (shard 2's Chromium and servers included).
- Failure looks like: the run waits forever, passes, or leaves Chromium or Vite running.

**WP-SHARD-11 · Ctrl-C during a sharded run.**

- Severity: blocker · Automatable: manual-only
- Steps: start `npm run ward -- --only e2e -- packages/web` in a terminal, press Ctrl-C after 60s.
- Expect: within 10s, `wp-orphans.sh` and `wp-ports.sh` show nothing. Compare with the same Ctrl-C on `master`: the sharded run may not leave more behind than the unsharded run did.

**WP-SHARD-12 · Killed by a timeout.**

- Severity: blocker · Automatable: manual-only
- Steps: `timeout 90 npm run ward -- --only e2e -- packages/web`. This is what an agent's tool timeout does.
- Expect: as WP-SHARD-11. Record what remains on `master` for the same command; the sharded run may not leave more.

**WP-SHARD-13 · Two sharded runs at once.**

- Severity: blocker · Automatable: manual-only
- Setup: ENV-MAIN and ENV-WT.
- Steps: start the full sharded e2e in both within one second.
- Expect: both exit 0; 6 different port pairs; 6 different `test-results/<port>` folders; neither report holds the other's tests.

**WP-SHARD-14 · The bundle build fails.**

- Severity: major · Automatable: integration
- Steps: introduce a type-free syntax error into a web source file that `vite build` rejects, run the e2e, undo.
- Expect: no Playwright process starts; one failure names the build error, as on `master`.

**WP-SHARD-15 · A spec file with no tests.**

- Severity: major · Automatable: integration
- Steps: add `packages/web/src/flows/wp-empty.e2e.ts` holding only an import of `test`, run the full sharded e2e, then delete the file. Repeat on `master`.
- Expect: the same verdict and the same discovery-mismatch output on both. `--pass-with-no-tests` must not hide a file that was discovered and never ran.

**WP-SHARD-16 · Open handles from a shard.**

- Severity: major · Automatable: integration
- Steps: add a `setInterval` that is never cleared to one spec in shard 3, run, undo.
- Expect: the summary's open-handles section names that spec once, as it would unsharded.

**WP-SHARD-17 · Leftover files.**

- Severity: minor · Automatable: manual-only
- Steps: count `packages/web/.ward-playwright-report-*.json`, the Vite cache folders `e2eArtifactsRemoveBroker`
  removes (read that broker for their location), and `packages/web/test-results/*` before and after WP-SHARD-01, -08 and -10.
- Expect: no report file and no Vite cache folder left by any run. `test-results/<port>` folders: empty ones left on a pass are expected; record how many a run leaves and check `e2eArtifactsPruneBroker` still sweeps them.

**WP-SHARD-18 · Raw output stays readable.**

- Severity: minor · Automatable: manual-only
- Steps: `npm run ward -- raw <runId>` after WP-SHARD-08.
- Expect: three shard headers in order; nothing cut in the middle of a shard by the raw-output cap. If the cap now trims, record which shard lost output.

**WP-SHARD-19 · Git-scoped run touching web specs and source.**

- Severity: major · Automatable: manual-only
- Steps: edit one spec file and one widget file (a harmless comment), run `npm run ward -- --uncommitted`, undo.
- Expect: e2e runs only the edited spec, in one process.

### CFG

**WP-CFG-01 · Config values.**

- Severity: major · Automatable: unit
- Steps: set `ward.e2eSharding` in `.dungeonmaster.json` to each value below and run `npm run ward -- --only e2e -- <two spec files>`. Restore `true` afterwards.

| Value                | Expect                                                               |
|----------------------|----------------------------------------------------------------------|
| key absent           | 1 process, the exact command `master` runs                           |
| `false`              | as above                                                             |
| `true`               | 2 processes (capped by the 2 spec files)                             |
| `"yes"`, `1`, `null` | ward refuses at config load with a message naming `ward.e2eSharding` |

**WP-CFG-02 · Shards are opt-in for consumers.**

- Severity: blocker · Automatable: manual-only
- Setup: ENV-CONS. If it holds no frontend-react package with a Playwright config, scaffold one with
  `dungeonmaster create-package` in the consumer.
- Steps: run the consumer's e2e through `npx dungeonmaster ward -- --only e2e`.
- Expect: one Playwright process, with no `--shard`. Then set `ward.e2eSharding: true` in the consumer and run again with two spec files: two processes, both passing, provided the consumer's Playwright config reads `DUNGEONMASTER_PORT`. If it hardcodes ports, the two collide. Record what the error says, because a consumer who opts in will see it.

**WP-CFG-03 · An old config still loads.** (after D)

- Severity: blocker · Automatable: unit
- Steps: set `ward.concurrency: 6` in `.dungeonmaster.json` (the key D removes) and run `npm run ward -- --only lint -- packages/config`. Do the same in ENV-CONS. Undo.
- Expect: both runs pass, print no error about the key, and the child-ward count is set by the governor, not by 6.

---

## Unit D: load balancing

### RES — machine limits in the home config

**WP-RES-01 · No `resources` block.**

- Severity: major · Automatable: unit
- Steps: with no `resources` in `~/.dungeonmaster/config.json`, run a bare ward.
- Expect: the run passes; no `load balancing degraded` line; the memory cap applied is 80% (WP-RES-05 shows how to check); the disk cap is 4096 MB (WP-DISK-02 shows how to check).

**WP-RES-02 · Invalid values.**

- Severity: major · Automatable: unit
- Steps: set each value below, run `npm run ward -- --only lint -- packages/config`, restore.

| `resources`                    | Expect                                                                                                           |
|--------------------------------|------------------------------------------------------------------------------------------------------------------|
| `{ "maxMemoryPercent": 5 }`    | the run passes; one `ward: load balancing degraded:` line naming `maxMemoryPercent`; the default is used         |
| `{ "maxMemoryPercent": 101 }`  | as above                                                                                                         |
| `{ "maxMemoryPercent": "80" }` | as above                                                                                                         |
| `{ "maxDiskMB": 10 }`          | as above, naming `maxDiskMB`; the disk pass uses 4096                                                            |
| `"resources": []`              | as above, naming `resources`                                                                                     |
| the whole file is `{`          | the run passes with defaults and one line; the web UI's guild list is a separate question, recorded in WP-RES-07 |

**WP-RES-03 · `DUNGEONMASTER_HOME` does not move the limits.**

- Severity: blocker · Automatable: integration
- Steps: put `"resources": { "maxMemoryPercent": 10 }` in `<repo>/.dungeonmaster/config.json` (the home `npm run prod` uses), and nothing in `~/.dungeonmaster/config.json`. Run a bare ward with `DUNGEONMASTER_HOME=<repo>/.dungeonmaster`. Then move the same block to `~/.dungeonmaster/config.json` and run again. Restore both files.
- Expect: the first run behaves as WP-RES-01 (cap 80%); the second as a 10% cap (fewer packages in flight; see WP-RES-05).

**WP-RES-04 · Saving a guild keeps the limits.**

- Severity: blocker · Automatable: integration
- Setup: ENV-RES with both keys set. `npm run build && npm run prod`.
- Steps: in the browser, add a guild (any folder), then remove it. Read `~/.dungeonmaster/config.json` after each step. Repeat under `npm run dev` against its own home, with a `resources` block in that home's `config.json`.
- Expect: `resources` is byte-for-byte unchanged after every save; the guild list in the UI shows the change with no console error.
- Failure looks like: `resources` gone after the first guild save.

**WP-RES-05 · The memory cap holds.**

- Severity: blocker · Automatable: manual-only
- Setup: ENV-RES with `maxMemoryPercent: 20` (about 12.5 GB on this machine). History present.
- Steps: a bare run with `wp-procs.sh`. For each sample, sum the RSS of every child ward's process tree.
- Expect: the sum stays under 20% of total memory, except for brief overshoots no larger than the biggest single package's recorded peak (a job may exceed its expected peak). Fewer packages run at once than in WP-GOV-01. Record the highest sum.

**WP-RES-06 · A cap smaller than one package.**

- Severity: blocker · Automatable: unit
- Setup: ENV-RES with `maxMemoryPercent: 10`, and a history whose web e2e peak is above 10% of memory (insert such samples with `wp-leases.mjs --durations-insert`, then set their `peak_rss_mb` by hand).
- Steps: a bare run.
- Expect: the run finishes, running one package at a time when nothing else fits. It never stalls waiting for room that can never appear.
- Failure looks like: ward hangs with no children running.

**WP-RES-07 · The rest of dungeonmaster still reads the file.**

- Severity: blocker · Automatable: integration
- Setup: ENV-RES.
- Steps: `npm run prod`; open the app; list guilds, open a quest; run the orchestrator's guild-config tests (`npm run ward -- -- packages/orchestrator/src/brokers/guild-config`).
- Expect: everything loads with no console error; the tests pass.

**WP-RES-08 · Container limits.**

- Severity: blocker · Automatable: manual-only
- Setup: ENV-CGROUP.
- Steps: `systemd-run --user --scope -p MemoryMax=4G -p CPUQuota=400% dungeonmaster siegelense status`, then the same prefix on a bare `npm run ward` with `wp-procs.sh` running outside the scope.
- Expect: status reports total memory about 4096 MB and 4 cores; the ward run never has more than 4 child wards at once; no check is reported out of memory; `oom_kill` in `/proc/vmstat` does not rise. Record the run time; slow files are expected on 4 cores and are a finding, not a failure.

**WP-RES-09 · Limits with no cgroup files.**

- Severity: minor · Automatable: unit
- Expect: D19's tests cover missing files and `max`. Read them and confirm they assert the host figures are used.

### REG — the registry file

**WP-REG-01 · A first run creates the registry.**

- Severity: major · Automatable: integration
- Steps: move `~/.dungeonmaster/load` aside, run `npm run ward -- --only lint -- packages/config`, then
  `ls -la ~/.dungeonmaster/load` and `node tmp/wp-leases.mjs`.
- Expect: the folder and `registry-v1.db` exist, readable only by you (folder mode `700` or tighter is ideal; record what it is); the `leases` table is empty after the run.

**WP-REG-02 · The override variable.**

- Severity: blocker · Automatable: integration
- Steps: `DUNGEONMASTER_LOAD_DIR=$PWD/tmp/wp-load-a/nested npm run ward -- --only lint -- packages/config`.
- Expect: the nested folder is created and holds the registry; `~/.dungeonmaster/load/registry-v1.db` is not modified (compare its modification time).

**WP-REG-03 · A registry that cannot be used does not stop the run.**

- Severity: blocker · Automatable: integration
- Steps: for each setup below, run `npm run ward -- --only lint`, then undo it.

| Setup                                                                          | Expect                                                                                                      |
|--------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `DUNGEONMASTER_LOAD_DIR` points at an existing regular file                    | exit 0, one `ward: load balancing degraded:` line, the run works from the machine reading alone (no leases) |
| the load folder is mode `500`                                                  | as above                                                                                                    |
| `registry-v1.db` holds 4 KB of random bytes                                    | as above, and the line names the file                                                                       |
| `registry-v1.db` is a valid SQLite file with a `leases` table missing a column | as above                                                                                                    |

- Failure looks like: a red run, a stack trace, the line printed once per package, or ward quietly deleting the user's file. If ward should replace a corrupt registry instead, that is a design change: record it.

**WP-REG-04 · A registry left mid-write by a killed process.**

- Severity: major · Automatable: manual-only
- Steps: start a full run; `kill -9` the parent and every child (`wp-orphans.sh --kill`). Confirm `-wal` and `-shm`
  files exist next to the registry. Run `npm run ward -- --only lint`.
- Expect: the second run opens the registry with no error, and the dead run's leases are gone.

**WP-REG-05 · Reading the registry while ward runs.**

- Severity: minor · Automatable: manual-only
- Steps: during a full run, run `node tmp/wp-leases.mjs` once a second for 60s.
- Expect: every read succeeds, and ward prints no lock error.

**WP-REG-06 · A newer registry version beside this one.**

- Severity: minor · Automatable: unit
- Steps: create an empty `registry-v2.db` in the load folder, run ward.
- Expect: ward uses `registry-v1.db` and leaves `v2` alone.

**WP-REG-07 · Full disk.**

- Severity: major · Automatable: manual-only
- Steps: mount a small tmpfs (`sudo mount -t tmpfs -o size=1m tmpfs <dir>`), fill it with `dd`, point
  `DUNGEONMASTER_LOAD_DIR` at it, run `npm run ward -- --only lint`, unmount.
- Expect: as WP-REG-03.

### LEASE

**WP-LEASE-01 · One lease per running child.**

- Severity: major · Automatable: integration
- Steps: during a bare run, sample `node tmp/wp-leases.mjs` and `wp-procs.sh` at the same moments.
- Expect: the ward leases equal the running child wards one for one: same count, each lease's `ownerPid` is a live child ward's pid, each label is that child's package. After the run, no ward lease remains.

**WP-LEASE-02 · Leases move from starting to running.**

- Severity: minor · Automatable: integration
- Expect: a lease reads `starting` right after its child spawns and `running` after its first heartbeat, and
  `lastBeatMs` advances about every 5s.

**WP-LEASE-03 · A crashed child releases its lease.**

- Severity: major · Automatable: integration
- Steps: `kill -9` one child ward during a run.
- Expect: that child's lease is gone at the next read, and the parent goes on with the rest.

**WP-LEASE-04 · A killed parent.**

- Severity: blocker · Automatable: manual-only
- Steps: during a bare run, `kill -9` the PARENT ward only. Then watch `wp-procs.sh` and `wp-leases.mjs`.
- Expect: record whether the child wards keep running (on `master` they do; nothing kills them). While a child runs, its lease stays, because the lease is owned by the child's pid. When each child exits, its lease drops at the next capacity read. Nothing is left once all children exit.
- Failure looks like: leases dropped while their children still burn CPU, or leases kept after the children exit.

**WP-LEASE-05 · A reused pid.**

- Severity: minor · Automatable: unit
- Steps: with `node tmp/wp-leases.mjs --insert`, add a ward lease whose `ownerPid` is your shell's pid (alive, not a ward) and whose `lastBeatMs` is 60s ago. Run any ward command.
- Expect: the fake lease is dropped, because its heartbeat is stale.

**WP-LEASE-06 · A heartbeat from the future.**

- Severity: minor · Automatable: unit
- Steps: insert a lease with a dead pid and `lastBeatMs` one hour in the future.
- Expect: dropped, because its pid is dead. Then insert one with a LIVE unrelated pid and a future heartbeat, and record what happens: it survives until that pid exits. A clock that jumped backwards produces this; note it as accepted or file a follow-up.

**WP-LEASE-07 · Many writers at once.**

- Severity: blocker · Automatable: integration
- Steps: start 4 `npm run ward -- --only lint` runs at once (main checkout plus three worktrees).
- Expect: no `SQLITE_BUSY`, no `database is locked`, no `load balancing degraded` line in any of them.

**WP-LEASE-08 · Suspend and resume.**

- Severity: minor · Automatable: manual-only
- Steps: during a run, `kill -STOP` the parent for 45s, then `kill -CONT`.
- Expect: while stopped, its leases go stale and another tool's capacity read ignores them; after resume, the run finishes and its leases come back on the next heartbeat. Record whether the parent re-inserts a lease that another reader deleted, or fails to beat it. A beat that updates a deleted row must not throw.

### GOV — the governor

**WP-GOV-01 · An idle machine goes above 4.**

- Severity: major · Automatable: manual-only
- Setup: idle machine, history present, no `resources` block.
- Steps: a bare run with `wp-procs.sh`.
- Expect: the CSV shows more than 4 child wards at some point; the run passes with no new slow files against BASE-SLOW; record the duration (the plan estimates about 300s).

**WP-GOV-02 · CPU bounds the count on an idle machine.**

- Severity: major · Automatable: manual-only
- Steps: during WP-GOV-01, read the most child wards at once from the CSV.
- Expect: it is never more than the core count (12 here). Record the highest. If memory never bound it, CPU did.

**WP-GOV-03 · A busy CPU throttles ward.**

- Severity: major · Automatable: manual-only
- Setup: ENV-BURN at 12 threads, started 2 minutes before ward so the load average has caught up.
- Steps: a bare run.
- Expect: the CSV shows 1 or 2 child wards at a time; the run finishes. Record slow files: some are expected, because the burner competes for every core. The case passes if ward stays at its floor and finishes.

**WP-GOV-04 · Load that starts with ward.**

- Severity: major · Automatable: manual-only
- Steps: start ENV-BURN and a bare ward run in the same second.
- Expect: record the first 60s of the CSV. The 1-minute load average lags, so ward may over-dispatch at first; record by how much and for how long. If it stays above the burner-adjusted limit past 90s, that is a failure.

**WP-GOV-05 · Low memory throttles ward.**

- Severity: blocker · Automatable: manual-only
- Setup: ENV-HOG leaving about 2000 MB available.
- Steps: a bare run. Note `grep oom_kill /proc/vmstat` before and after.
- Expect: concurrency stays low; the OOM counter does not rise; no check is reported as out of memory.

**WP-GOV-06 · Two ward runs at once.** (the plan's headline acceptance criterion)

- Severity: blocker · Automatable: manual-only
- Setup: ENV-MAIN and ENV-WT, idle machine.
- Steps: start a bare run in each within one second, with `wp-procs.sh` running machine-wide.
- Expect: both exit 0 with no slow files beyond BASE-SLOW; the combined child-ward count never exceeds the core count; `wp-leases.mjs` shows both runs' leases during the run.

**WP-GOV-07 · Four ward runs at once.**

- Severity: major · Automatable: manual-only
- Steps: as WP-GOV-06 with four checkouts.
- Expect: all four finish. Each always has at least 1 child running (no run starves). Record each duration and the slow files. Slow files here are a finding to report, not an automatic failure.

**WP-GOV-08 · Jest's share follows concurrency.**

- Severity: major · Automatable: integration
- Steps: during WP-GOV-01, record the `--maxWorkers=<n>%` argument of every Jest process in the CSV, and count Jest worker processes per sample.
- Expect: the percentage is `max(10, floor(100 / in-flight))` at the moment that child was dispatched; the Jest worker processes alive at once never exceed the core count by more than the number of children in flight.

**WP-GOV-09 · Shard count under load.**

- Severity: major · Automatable: manual-only
- Setup: ENV-BURN.
- Steps: `npm run ward -- --only e2e -- packages/web`.
- Expect: fewer than 3 Playwright processes; the run passes.

**WP-GOV-10 · History records memory.**

- Severity: minor · Automatable: integration
- Steps: after a bare run, read `peak_rss_mb` per package from `wp-leases.mjs --durations`. During the same run, sample the RSS of each child's process tree by hand (`wp-procs.sh` records it).
- Expect: each recorded peak is within 20% of your highest sample for that package; web's e2e peak includes its browsers and servers (it should be the largest).
- Failure looks like: web's peak about the size of a single Node process. That means the sampler missed Playwright's own process groups.

**WP-GOV-11 · Ward next to the dev and prod servers.**

- Severity: minor · Automatable: manual-only
- Steps: with `npm run dev` running, run a bare ward.
- Expect: ward passes, and the dev server is still up and answering afterwards. Ward must never kill a process it did not start.

### SIG — stopping ward

**WP-SIG-01 · Ctrl-C stops everything.**

- Severity: blocker · Automatable: manual-only
- Steps: start a bare run in a terminal. Press Ctrl-C at 30s, at 120s (while e2e runs), and at 300s, in three separate runs.
- Expect: within 10s, `wp-orphans.sh` and `wp-ports.sh` show nothing. Leases of that run drop at the next read. Compare with `master`: nothing may be left that `master` would not leave.

**WP-SIG-02 · A timeout kill.**

- Severity: blocker · Automatable: manual-only
- Steps: `timeout 120 npm run ward`, and `timeout -s KILL 120 npm run ward`.
- Expect: record what remains in each, and on `master` for the same commands. Nothing may remain that `master`
  leaves no trace of.

**WP-SIG-03 · An agent's tool timeout.**

- Severity: blocker · Automatable: manual-only
- Steps: from a Claude Code session, run `npm run ward` through the Bash tool with `timeout: 60000`.
- Expect: as WP-SIG-02.

### SIEGE — siegelense

**WP-SIEGE-01 · Siegelense still reports the machine.**

- Severity: major · Automatable: integration
- Steps: `dungeonmaster siegelense status` and `dungeonmaster siegelense capacity --spec <a spec name>`, before and after Unit D (keep the `master` output).
- Expect: the machine block holds the same fields with sensible values. The capacity answer differs only by the new lease debit.

**WP-SIEGE-02 · A lane takes and releases a lease.**

- Severity: major · Automatable: integration
- Steps: `dungeonmaster siegelense start ...` (see `dungeonmaster siegelense docs --for walking`), read the registry, then `kill` the instance and read again.
- Expect: one `siegelense` lease while it runs, labelled with the instance id; none after the kill.

**WP-SIEGE-03 · Ward and a lane see each other.**

- Severity: major · Automatable: manual-only
- Steps: start a lane, then a bare ward run. While both run, run siegelense's capacity, and read ward's stderr and the CSV.
- Expect: siegelense's capacity counts ward's starting leases; ward's concurrency is lower than in WP-GOV-01.

**WP-SIEGE-04 · A crashed lane.**

- Severity: major · Automatable: manual-only
- Steps: start a lane, `kill -9` its process group, then run siegelense's capacity and a ward command.
- Expect: the lane's lease is gone from both answers.

**WP-SIEGE-05 · The orchestrator still provisions lanes.**

- Severity: blocker · Automatable: integration
- Steps: run the orchestrator's lane provisioning tests:
  `npm run ward -- -- packages/orchestrator/src/brokers/lane/provision-batch`. Then run one quest that reaches siegemaster under `npm run dev`, and watch it in the browser.
- Expect: the tests pass; the quest's siege step starts its lanes, and the UI shows them, with no console errors.

### PLAT — no `/proc`, other platforms

**WP-PLAT-01 · No `/proc`.**

- Severity: blocker · Automatable: unit
- Steps: read the unit tests for `machineRssByTreeBroker`, `machineReadBroker` and the governor fallback. If a macOS machine is available, run a bare ward in ENV-CONS there.
- Expect: the tests cover "no `/proc`" and assert that the governor still runs from Node's `os` readings, with one `load balancing degraded` line naming the missing memory samples. On macOS, the run passes, runs more than one package at once on an idle machine, and prints that line once.
- Failure looks like: `ENOENT: /proc/...` ending the run. Every macOS consumer would hit it.

**WP-PLAT-02 · Windows.**

- Severity: minor · Automatable: manual-only
- Steps: none unless Windows support is claimed. Check the README and the consumer docs.
- Expect: record whether ward claims Windows support. `portKillListenersBroker` already uses `lsof`, so it probably does not; if it does, Unit D needs its own Windows pass.

### ISO — tests never touch the real registry

**WP-ISO-01 · An audit of the real registry during a test run.**

- Severity: blocker · Automatable: manual-only
- Steps: `node tmp/wp-leases.mjs --audit-on` (installs a trigger that logs every insert into an `audit` table). Run `npm run ward -- --only unit,integration -- packages/load-balancer packages/siegelense packages/ward`. Then
  `node tmp/wp-leases.mjs --audit-show` and `--audit-off`.
- Expect: every audited insert has `tool: 'ward'` and a label that is a real package name of this repo (the parent ward's own leases). No fixture label, no `siegelense` row, no row from a test.

**WP-ISO-02 · e2e servers stay isolated.**

- Severity: major · Automatable: manual-only
- Steps: during WP-SHARD-01, run the audit as above.
- Expect: only the parent ward's own leases. The e2e servers run with `HOME` set to their test home, so anything they did would land there.

---

## Unit S: disk budget

**WP-DISK-01 · Baseline.**

- Steps: read S0's table in the plan (§2.6). Snapshot every store with `tmp/wp-disk-snap.sh > tmp/wp-disk-<case>-before.txt` (Appendix A).
- Expect: the table and the snapshot agree within 5% per store.

**WP-DISK-02 · Under the default cap, no change.**

- Severity: blocker · Automatable: integration
- Steps: with no `maxDiskMB` set (default 4096) and the stores under it (about 200 MB on this machine, measured 2026-10-02), snapshot, run a bare ward, snapshot again, diff.
- Expect: every deleted item is one a store's own pruner deletes today (an expired `.ward` run file, a swept e2e artifact). No `disk budget freed` line. Compare with the same diff on `master` if in doubt.

**WP-DISK-02b · The first run after upgrading, on a machine over 4 GB.**

- Severity: blocker · Automatable: manual-only
- Setup: no `maxDiskMB` set. Create about 5 GB of old items in stores whose own pruner keeps them: for example 10 folders `packages/web/test-results/7<nnnn>/` each holding a 500 MB file made with `fallocate -l 500M`, backdated a day with `touch -d '1 day ago'` (folder and file). Clear the rate limit (WP-DISK-07).
- Steps: run `npm run ward -- --only lint -- packages/config`. Delete what is left of the fake folders afterwards.
- Expect: one `ward: disk budget freed` line of roughly 1.2 GB or more; the total is under 4096 MB; only fake folders were deleted, oldest first; the run's verdict is unchanged.

**WP-DISK-03 · A cap below current usage.**

- Severity: blocker · Automatable: integration
- Setup: ENV-RES with `maxDiskMB` set to about half the S0 total (never below 1024).
- Steps: snapshot, run `npm run ward -- --only lint -- packages/config`, snapshot, diff.
- Expect: one `ward: disk budget freed <MB> MB (<count> items)` line; the stores' total is now under the cap, or a shortfall line explains why not; every deleted item is older than every kept unprotected item; the run's verdict is unchanged.

**WP-DISK-04 · Protected items survive.**

- Severity: blocker · Automatable: integration
- Setup: as WP-DISK-03 with `maxDiskMB: 1024`. In ENV-WT, start a sharded e2e run first, and start a siegelense lane.
- Steps: while both run, run `npm run ward -- --only lint -- packages/config` in ENV-MAIN. Clear the rate limit first (WP-DISK-07 says how).
- Expect: the running e2e run's `dm-e2e-<pid>` homes, the lane's evidence, the newest run file of every repo, and anything modified in the last 10 minutes all remain. A shortfall line appears. The ENV-WT e2e run and the lane both finish normally.

**WP-DISK-05 · Never follows a symlink out.**

- Severity: blocker · Automatable: integration
- Steps: create `tmp/wp-precious.txt` and `tmp/wp-precious-dir/`. Inside `.ward/`, make `run-1000000000000-wp.json` a symlink to `tmp/wp-precious.txt`; inside `packages/web/test-results/`, make a folder `wp-link` a symlink to `tmp/wp-precious-dir`. Backdate both links (`touch -h -d '2020-01-01'`). Run with a small cap and the rate limit cleared.
- Expect: `tmp/wp-precious.txt` and `tmp/wp-precious-dir/` and its contents still exist. The links themselves may be deleted.

**WP-DISK-06 · A guild whose folder is gone.**

- Severity: major · Automatable: integration
- Steps: back up `~/.dungeonmaster/config.json`, add a guild whose `path` does not exist, run a disk pass from ENV-MAIN with the rate limit cleared, restore the file.
- Expect: no error; the pass covers the current repo and the remaining guilds.

**WP-DISK-07 · Rate limit.**

- Severity: minor · Automatable: integration
- Steps: run two ward commands back to back with a cap set. Then set `meta.diskBudgetLastRunMs` to 11 minutes ago with `node tmp/wp-leases.mjs --meta-age 660000` and run again.
- Expect: the second run does no pass (no line, no deletions); the third does.

**WP-DISK-08 · Two passes at once.**

- Severity: major · Automatable: integration
- Steps: clear the rate limit and start two ward commands in the same second from ENV-MAIN and ENV-WT.
- Expect: exactly one pass runs; neither run errors.

**WP-DISK-09 · Unreadable items.**

- Severity: major · Automatable: integration
- Steps: `chmod 000` one old `test-results/<port>` folder, run a pass, restore.
- Expect: the pass completes; that folder is skipped; no stack trace.

**WP-DISK-10 · What a pass costs.**

- Severity: minor · Automatable: manual-only
- Steps: time a ward command with the rate limit cleared and with it set.
- Expect: record the difference. Over 5s is a finding: the scan then needs caching or a cheaper size estimate.

**WP-DISK-11 · Siegelense cleanup runs the pass.**

- Severity: major · Automatable: integration
- Steps: with a cap set and the rate limit cleared, run siegelense's `cleanup`.
- Expect: its output reports the pass; the stores shrink as in WP-DISK-03.

**WP-DISK-12 · Another repo's files: only through the guild list.**

- Severity: blocker · Automatable: manual-only
- Setup: ENV-CONS kept, with old ward run files and old `test-results` folders. Back up `~/.dungeonmaster/config.json`.
- Steps:
    1. With the consumer NOT in `~/.dungeonmaster/config.json`'s guilds, run a pass from ENV-MAIN with a small cap.
    2. Add the consumer's folder as a guild in `~/.dungeonmaster/config.json`, and run the pass again.
    3. Restore the file.
- Expect: step 1 deletes nothing in the consumer. Step 2 may delete the consumer's oldest items, never its newest ward run file. The user approved this on 2026-10-02.

## Unit R: home config rename

**WP-REN-01 · The app still reads the file.**

- Severity: blocker · Automatable: integration
- Setup: `npm run build`, then `npm run prod`.
- Steps: open the app; the guild list loads; add a guild, rename it, remove it; open an existing quest. Repeat under `npm run dev`.
- Expect: every step works with no console error, and `config.json` in each home holds the same `guilds` shape as before the rename.

**WP-REN-02 · No old names left in code.**

- Severity: major · Automatable: manual-only
- Steps: `discover` with grep `guildConfigContract|GuildConfig|guildConfigReadBroker|guildConfigWriteBroker|guild-config` and `strict: true`.
- Expect: matches only under `scrolls/`.

## Publish rehearsal

**WP-PUB-01 · The published-output check.**

- Severity: blocker · Automatable: manual-only
- Steps: `npm run build:clean && npm run check:published`.
- Expect: exit 0. `@dungeonmaster/load-balancer` is graded with the rest.

**WP-PUB-02 · A local consumer.**

- Severity: blocker · Automatable: manual-only
- Steps: `npm run check:consumer -- --mode=local --keep`. Then, in the kept consumer: `npx dungeonmaster ward` twice at once, and `node <repo>/tmp/wp-leases.mjs` during the run.
- Expect: the check passes; both consumer runs pass; the registry is the same one this repo's runs use (`~/.dungeonmaster/load`), so their leases appear beside any of this repo's.

**WP-PUB-03 · A global-only consumer.**

- Severity: blocker · Automatable: manual-only
- Steps: `npm run check:consumer -- --mode=global --keep`, then `dungeonmaster ward` in the kept consumer.
- Expect: the check passes. `@dungeonmaster/load-balancer` resolves from the global install (look for it in
  `npm ls -g`).

**WP-PUB-04 · The new package ships.**

- Severity: blocker · Automatable: manual-only
- Steps: `npm pack --dry-run` in the repo root and in `packages/load-balancer`.
- Expect: the root package lists `@dungeonmaster/load-balancer` in `dependencies`; the package's tarball holds its
  `dist/` and no test, proxy or stub file.

**WP-PUB-05 · A path with spaces.**

- Severity: major · Automatable: manual-only
- Steps: copy the kept local consumer to a folder whose path holds a space, run `npx dungeonmaster ward` there with `ward.e2eSharding: true` if it has e2e.
- Expect: the run passes; history and reports land in the right folders.

**WP-PUB-06 · Re-running `init` keeps the new keys.**

- Severity: major · Automatable: manual-only
- Steps: in the kept consumer, set `ward.e2eSharding: true`, and put a `resources` block in `~/.dungeonmaster/config.json`; run `dungeonmaster init`
  again.
- Expect: `ward.e2eSharding` and the whole `resources` block survive unchanged.

---

## Which cases gate which unit

A unit merges only when every case listed for it passes, or the user accepts a named failure.

| Unit              | Gate cases                                                                                                                           |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| N                 | WP-NODE-01, -02, -05, -06, -07, -09; WP-REG-01, -02; WP-ISO-01                                                                       |
| A                 | WP-POOL-01 to -08, WP-HIST-01 to -12                                                                                                 |
| B                 | WP-SHARD-01 to -19, WP-CFG-01, WP-CFG-02                                                                                             |
| R                 | WP-REN-01, WP-REN-02                                                                                                                 |
| D                 | WP-NODE-03, -04, -08; WP-CFG-03; every RES, REG, LEASE, GOV, SIG, SIEGE, PLAT and ISO case; WP-GOV-06 and WP-RES-04 are the headline |
| S                 | every DISK case; WP-DISK-05 is the headline                                                                                          |
| Before publishing | every PUB case, then WP-POOL-04, WP-SHARD-01, WP-GOV-06, WP-SIG-01, WP-RES-04, WP-RES-08 and WP-DISK-05 again on the final commit    |

---

## Appendix A: helper scripts

Create these in `<repoRoot>/tmp/` (never `~/tmp`). They are scratch tools; do not commit them.

### `wp-procs.sh` — sample the process table

Writes one CSV row per second: time, then for each process of interest its pid, parent pid, process group, cwd, RSS in MB and full command line. Run it as `tmp/wp-procs.sh > tmp/wp-procs-<case>.csv` and stop it with Ctrl-C.

```bash
#!/usr/bin/env bash
pattern='ward-entry|jest|eslint|tsc|playwright|chrom|vite|server-entry|tsx'
while true; do
  now=$(date +%s.%N)
  ps -eo pid=,ppid=,pgid=,rss=,args= | grep -E "$pattern" | grep -v grep | while read -r pid ppid pgid rss args; do
    cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null)
    printf '%s,%s,%s,%s,%s,%d,"%s"\n' "$now" "$pid" "$ppid" "$pgid" "$cwd" "$((rss / 1024))" "$args"
  done
  sleep 1
done
```

Count child wards in a sample: rows whose command holds `ward-entry.js run` and whose parent is another ward.

### `wp-orphans.sh` — list (or kill) what ward left behind

```bash
#!/usr/bin/env bash
pattern='ward-entry|jest-worker|jest|playwright|chrom.*--headless|vite preview|server-entry'
ps -eo pid=,ppid=,etimes=,args= | grep -E "$pattern" | grep -v grep
if [ "$1" = "--kill" ]; then
  ps -eo pid=,args= | grep -E "$pattern" | grep -v grep | awk '{print $1}' | xargs -r kill -9
fi
```

Run it with nothing else of these kinds open (close any IDE test runner first), or you will see your own processes.

### `wp-ports.sh` — listeners ward may have left

```bash
#!/usr/bin/env bash
ss -ltnp | grep -E 'node|vite|chrom' || echo 'no listeners'
```

Compare against a sample taken before the run. Anything new is a leftover.

### `wp-leases.mjs` — read the registry

```js
import {DatabaseSync} from 'node:sqlite';
import {homedir} from 'node:os';
import {join} from 'node:path';

const dir = process.env.DUNGEONMASTER_LOAD_DIR ?? join(homedir(), '.dungeonmaster', 'load');
const db = new DatabaseSync(join(dir, 'registry-v1.db'), {timeout: 5000});
const [flag] = process.argv.slice(2);

if (flag === '--audit-on') {
    db.exec(`CREATE TABLE IF NOT EXISTS audit (at INTEGER, tool TEXT, label TEXT, owner_pid INTEGER);
    CREATE TRIGGER IF NOT EXISTS audit_insert AFTER INSERT ON leases BEGIN
      INSERT INTO audit VALUES (strftime('%s','now'), NEW.tool, NEW.label, NEW.owner_pid); END;`);
} else if (flag === '--audit-show') {
    console.table(db.prepare('SELECT * FROM audit').all());
} else if (flag === '--audit-off') {
    db.exec('DROP TRIGGER IF EXISTS audit_insert; DROP TABLE IF EXISTS audit;');
} else if (flag === '--durations') {
  console.table(db.prepare('SELECT * FROM durations WHERE repo_root = ? ORDER BY package, check_type, recorded_at_ms')
          .all(process.cwd()));
} else if (flag === '--durations-clear') {
  const [, repoRoot] = process.argv.slice(2);
  db.prepare('DELETE FROM durations WHERE repo_root = ?').run(repoRoot);
} else if (flag === '--durations-insert') {
  const [, pkg, checkType, ms] = process.argv.slice(2);
  db.prepare(`INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms)
    VALUES (?, ?, ?, ?, NULL, NULL, ?)`).run(process.cwd(), pkg, checkType, Number(ms), Date.now());
} else if (flag === '--meta-age') {
    const [, ageMs] = process.argv.slice(2);
    db.prepare(`INSERT INTO meta (key, value) VALUES ('diskBudgetLastRunMs', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(String(Date.now() - Number(ageMs)));
} else if (flag === '--insert') {
    const [, ownerPid, beatAgoMs] = process.argv.slice(2);
    const now = Date.now();
    db.prepare(`INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, started_at_ms, last_beat_ms)
    VALUES (?, 'ward', 'wp-fake', ?, 'running', NULL, ?, ?)`)
        .run(`wp-fake-${now}`, Number(ownerPid), now, now - Number(beatAgoMs));
} else {
    console.table(db.prepare('SELECT * FROM leases').all());
}
```

The column names must match the table D6 creates. Check them with `.schema` the first time, and fix this script, not the table.

### `wp-sqlite-contend.mjs` — many processes, one file

Spawns N children of itself. Each opens one database through the gateway's built output (or `node:sqlite` with the same timeout, if the gateway is not built), and inserts 200 rows, each in its own `BEGIN IMMEDIATE` transaction. The parent waits for all, then prints the row count.

```js
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const [mode, arg] = process.argv.slice(2);
if (mode === 'child') {
    const db = new DatabaseSync(arg, {timeout: 5000});
    db.exec('PRAGMA journal_mode=WAL');
    for (let i = 0; i < 200; i += 1) {
        db.exec('BEGIN IMMEDIATE');
        db.prepare('INSERT INTO t (pid, i) VALUES (?, ?)').run(process.pid, i);
        db.exec('COMMIT');
    }
} else {
    const file = join(mkdtempSync(join(tmpdir(), 'wp-contend-')), 'c.db');
    new DatabaseSync(file).exec('CREATE TABLE t (pid INTEGER, i INTEGER)');
    const n = Number(mode ?? 20);
    const codes = await Promise.all(Array.from({length: n}, () => new Promise((resolve) => {
        spawn(process.execPath, [process.argv[1], 'child', file], {stdio: 'inherit'}).on('exit', resolve);
    })));
    const rows = new DatabaseSync(file).prepare('SELECT count(*) AS c FROM t').get().c;
    console.log({exitCodes: codes, rows, expected: n * 200});
}
```

### `wp-disk-snap.sh` — list every item in every store

```bash
#!/usr/bin/env bash
# One line per file: size, mtime, path. Pass the store roots from S0's table as arguments.
for root in "$@"; do
  find "$root" -xdev \( -type f -o -type l \) -printf '%s\t%T@\t%p\n' 2>/dev/null
done | sort -k3
```

Diff two snapshots with `diff <(cut -f3 before.txt) <(cut -f3 after.txt)` to list what was deleted.

### `wp-burn.mjs` and `wp-hog.mjs`

```js
// wp-burn.mjs <threads>: keep that many cores at 100%
import {Worker} from 'node:worker_threads';

const n = Number(process.argv[2] ?? 12);
for (let i = 0; i < n; i += 1) new Worker('for(;;){}', {eval: true});
```

```js
// wp-hog.mjs <MB>: hold that much memory, touched so the OS really commits it
const mb = Number(process.argv[2]);
const blocks = [];
for (let i = 0; i < mb; i += 1) blocks.push(Buffer.alloc(1024 * 1024, 1));
setInterval(() => blocks.length, 60_000);
```

Run `wp-hog.mjs` with `node --max-old-space-size=<MB plus 512>`. Buffers live outside the V8 heap, but the flag keeps the process from dying early if it needs heap for the array.

---

## Appendix B: edge cases this plan found, and where the plan now answers them

Writing these cases exposed gaps in the plan. Each row says what was missing and which decision in the plan's §3 now covers it. A case above tests each one.

| Edge case                                                                 | What would have happened                                                                                                              | The plan now says                                                                         | Tested by                 |
|---------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|---------------------------|
| A consumer's Playwright config hardcodes its ports or home                | A default of 3 shards would collide in every such consumer the day this ships                                                         | `ward.e2eSharding` defaults to false; this repo opts in; the machine picks the count      | WP-CFG-01, WP-CFG-02      |
| Child wards in their own process groups                                   | Ctrl-C and a terminal hangup reach only the parent; every Jest, Playwright and browser keeps running                                  | Children stay in the parent's group                                                       | WP-SIG-01 to -03          |
| Playwright starts browsers and servers in their own process groups        | A process-group memory sample misses most of web's memory, so the governor under-counts the biggest job                               | Sample the process tree by parent pid                                                     | WP-GOV-10                 |
| The governor's ceiling was `ward.concurrency` (default 4)                 | The governor could never go above 4, so D's main speedup could not happen                                                             | No count in config at all; `ward.concurrency` is removed and the machine decides          | WP-GOV-01, -02, WP-CFG-03 |
| Machine limits in the committed `.dungeonmaster.json`                     | One teammate's laptop values would apply to everyone's machine and to CI                                                              | `resources` lives in `~/.dungeonmaster/config.json`                                       | WP-RES-03                 |
| `resources` added to the home `config.json` without changing its contract | The guild contract drops unknown keys, so the first guild save after a user set limits would silently erase them                      | `resources` joins `guildConfigContract`                                                   | WP-RES-04                 |
| `DUNGEONMASTER_HOME` as the source of machine limits                      | In this repo `npm run prod` points it into the repo, and e2e points it at a temp folder, so the limits would change with the launcher | Limits come from `os.homedir()`                                                           | WP-RES-03                 |
| A container's memory and CPU                                              | Node reports the host, so ward inside a 4 GB container plans for 64 GB and is killed                                                  | The machine reading honours cgroup v2 limits                                              | WP-RES-08                 |
| A memory cap smaller than one package                                     | The governor could wait forever for room that never comes                                                                             | The floor of 1 package in flight                                                          | WP-RES-06                 |
| The disk pass deleting through a symlink                                  | A link inside a store could point anywhere in the user's home                                                                         | `lstat` sizes, and a `realpath` check before each delete                                  | WP-DISK-05                |
| The disk pass deleting silently                                           | A user would find files gone with no idea why                                                                                         | One `disk budget freed` line per pass that deleted anything                               | WP-DISK-03                |
| Leases owned by the parent's pid                                          | A SIGKILLed parent's leases drop while its orphaned children still use the machine                                                    | Leases are owned by the child's pid                                                       | WP-LEASE-04               |
| No `/proc` (macOS)                                                        | The machine readers throw `ENOENT`, and every macOS consumer's ward run fails                                                         | The governor runs from Node's `os` readings, without memory samples, with one stderr line | WP-PLAT-01                |
| An unusable registry file or folder                                       | A corrupt or read-only file under the user's home turns every ward run red                                                            | The governor runs without leases, with one stderr line                                    | WP-REG-03, -07            |
| History that cannot be read or written                                    | An unusable registry turns a green run red                                                                                            | One stderr line, verdict unchanged, discovery order                                       | WP-HIST-03                |
| History as one JSON file per repo                                         | Two runs finishing together: the last writer wins and the other's timings are lost; one slow run reorders the next                    | History is samples in the registry, 5 per key, median prediction                          | WP-HIST-02, -06           |
| Old Node vs the governor's fallback                                       | A blanket "fall back on any error" would quietly run on Node 21 and hide the floor                                                    | `NodeVersionUnsupportedError` is the one error that still stops the run                   | WP-NODE-03, -04           |
| `--pass-with-no-tests` on every shard                                     | Could hide a spec file that was discovered and never ran                                                                              | The discovery-mismatch check still runs on the merged result; WP-SHARD-15 proves it       | WP-SHARD-15               |

Decided by the user on 2026-10-02:

| Question                                                  | Decision                                                                                                                                         |
|-----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| May the disk pass delete another repo's old ward results? | Yes, for repos in the guild list of `~/.dungeonmaster/config.json`, plus the repo the run is in. No other repo is touched. Tested by WP-DISK-12. |
| Should `maxDiskMB` have a default?                        | Yes, 4 GB (4096 MB). Tested by WP-DISK-02 and WP-DISK-02b.                                                                                       |
| Should `guildConfigContract` be renamed?                  | Yes, in this plan: Unit R, to `homeConfigContract`. Tested by WP-REN-01 and WP-REN-02.                                                           |

Still open, to decide after the cases run:

| Question                                                                                                      | Why it is open                                                                                                      | Decided by                               |
|---------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| Should ward replace a corrupt registry instead of falling back every run?                                     | Falling back is safe but slow forever; replacing deletes a file in the user's home                                  | WP-REG-03's result, then the user        |
| Should history drop packages, and repo paths, that no longer exist?                                           | Rows stay forever for a deleted package or a moved repo, at most 5 per package and check type                       | WP-HIST-13's measured size               |
| A heartbeat stamped in the future (clock jumped back) with a live unrelated pid survives until that pid exits | Rare, and self-healing                                                                                              | WP-LEASE-06's result                     |
| Do shards need duration-balanced file lists?                                                                  | Playwright balances by test count                                                                                   | WP-SHARD-03's measured spread            |
| Should the registry folder be created mode `700`?                                                             | It records process ids and package names of this user's work                                                        | WP-REG-01's observed mode                |
| Is 80% the right default for `maxMemoryPercent`?                                                              | It leaves 20% for the user's own programs on any machine; a 16 GB laptop running an IDE and a browser may want less | WP-RES-05 on this machine, then the user |
| Is 8 the right upper bound on e2e shards?                                                                     | Each shard is a browser and two servers; the capacity answer may allow more on a big machine                        | WP-GOV-09 and WP-SHARD-03 measurements   |
