# Ward Parallelization & Machine Load Balancing

Status: high-level plan, revised 2026-10-01. Awaiting approval. Low-level step plans and manual test cases are written per unit after approval, in `scrolls/ward-parallelization/`.

---

## 1. Goal

Make a full `npm run ward` faster on every run, and stop ward runs from failing on CPU contention when several agents run at once. The speedup must not cost correctness: every check still runs every time, so a pass always means "the tree passes now".

## 2. What we measured

### 2.1 Where the time goes

The last full run, `.ward/run-1790901309167-9740.json`, took **980s**. All packages together hold about
**1,940s** of work.

| Package                        | Total            | Biggest parts                |
|--------------------------------|------------------|------------------------------|
| `@dungeonmaster/web`           | 451s             | e2e 336s, lint 54s, unit 43s |
| `@dungeonmaster/orchestrator`  | 215s             | lint 106s, unit 73s          |
| `@dungeonmaster/eslint-plugin` | 151s             | unit 56s, lint 48s           |
| `@dungeonmaster/siegelense`    | 142s             | integration 55s, lint 53s    |
| `@dungeonmaster/shared`        | 123s             | lint 63s                     |
| every other package            | 24s to 106s each |                              |

### 2.2 How ward schedules today

| Fact                                                                                                                                                    | Evidence                                                                                                                                                 |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| The parent ward spawns one child ward process per package. The child runs that package's check types one after another.                                 | `packages/ward/src/brokers/command/run/multi-package-layer-broker.ts:142` ("const spawnResult = await stream({") and `single-package-layer-broker.ts:65` |
| The number of packages in flight is `ward.concurrency` from `.dungeonmaster.json`, default 4, range 1 to 10.                                            | `multi-package-layer-broker.ts:91`, `packages/config/src/statics/config-defaults/config-defaults-statics.ts:29`                                          |
| Packages run in discovery order. Nothing sorts them.                                                                                                    | `packages/ward/src/brokers/workspace/discover/pattern-resolve-layer-broker.ts:29`                                                                        |
| **The pool deals packages out round-robin before anything runs.** A worker that finishes early sits idle; it never takes another worker's next package. | `packages/shared/src/transformers/promise-pool/promise-pool-transformer.ts:28` — "itemIndex % workerCount === workerIndex"                               |
| Jest runs with `--maxWorkers=25%`, sized for about 4 packages in flight.                                                                                | `packages/ward/src/statics/check-commands/check-commands-statics.ts:50`                                                                                  |
| A run exits 1 when any test is over its slow-test limit, even if every check passed. This is the gate CPU contention trips.                             | `packages/ward/src/statics/slow-file-threshold/slow-file-threshold-statics.ts`, `command-run-broker.ts:234`                                              |
| Per-package, per-check durations are already in `.ward/run-*.json`. But those files are deleted after 2 days, and one can reach about 290 MB.           | `packages/ward/src/statics/ttl/ttl-statics.ts:17`                                                                                                        |

### 2.3 How web's e2e runs today

| Fact                                                                                                        | Evidence                                                                                                         |
|-------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| One Playwright process, `workers: 1`, `fullyParallel: false`.                                               | `packages/web/playwright.config.ts:218-219`                                                                      |
| One API server and one `vite preview` server serve the whole suite, from one home: `<tmpdir>/dm-e2e-<pid>`. | `packages/web/playwright.config.ts:19`, `.dungeonmaster.json` `devServer.e2e.processes`                          |
| The API server holds an in-memory dispatcher for the whole run.                                             | `packages/web/test/harnesses/e2e-fixtures.ts:57` — "The dispatcher is ONE in-memory singleton for the whole run" |
| Ward picks a free port pair per e2e run and passes it in.                                                   | `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts:158`                                            |
| web is the only package with Playwright e2e: 132 spec files, 489 tests in the last run.                     | `packages/web/playwright.config.ts` is the only Playwright config in the repo                                    |

### 2.4 How siegelense balances load today

| Fact                                                                                                                                                                           | Evidence                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| The machine readers (load average, free memory, cores, RSS by process group, OOM count) take no siegelense types.                                                              | `packages/siegelense/src/brokers/machine/{read,rss-by-pgid,oom-count}/`                    |
| The registry is tied to lanes: SiegeInstance id, quest and guild ids, socket path, ports, spec hash.                                                                           | `packages/siegelense/src/contracts/registry-entry/registry-entry-contract.ts:55-91`        |
| The registry lives under `<DUNGEONMASTER_HOME>/siegelense/`. Dogfood prod, dev, every e2e home and every siege lane have different homes, so they never see each other's rows. | `packages/shared/src/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.ts:17` |
| The orchestrator loads siegelense's `capacityReadBroker` at runtime to cap lanes.                                                                                              | `packages/orchestrator/src/brokers/lane/provision-batch/lane-provision-batch-broker.ts:82` |
| The capacity math (CPU, memory and ceiling limits) is a pure transformer.                                                                                                      | `packages/siegelense/src/transformers/capacity-suggest/capacity-suggest-transformer.ts`    |

## 3. Decisions

| Question                                | Decision                                                                                                                                                                                | Why                                                                                                                                                           |
|-----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Order of work                           | A, then B, then D (§4). C is dropped (§5).                                                                                                                                              | Each unit pays off on its own. A and B touch no shared state. D needs a newer Node.                                                                           |
| How web's e2e runs in parallel          | Ward-level sharding: ward starts N `playwright test --shard=i/N` processes.                                                                                                             | Each shard is its own process, so it already gets its own `dm-e2e-<pid>` home, servers and dispatcher. No harness changes.                                    |
| Package granularity                     | Keep one child ward process per package. Web's e2e shards run inside web's child.                                                                                                       | Splitting checks into separate jobs adds children and Jest contention for little gain once e2e is sharded.                                                    |
| Where duration and memory history lives | Per repo, in the main checkout's `.ward/`, found through `git rev-parse --git-common-dir`. Every worktree of the repo shares it. Outside git, it falls back to the run root's `.ward/`. | History is about this repo's packages, and it means nothing in another repo. Deleting `.ward/` resets one repo only.                                          |
| Where the live registry lives           | One machine-wide folder, `~/.dungeonmaster/load/`, ignoring `DUNGEONMASTER_HOME`. Tests point it elsewhere with a new env var, `DUNGEONMASTER_LOAD_DIR`.                                | CPU and memory are shared by every repo, home and agent on the machine. A registry per home lets two agents each see an idle machine.                         |
| Registry file format                    | SQLite through `node:sqlite`, with the format version in the file name: `registry-v1.db`.                                                                                               | SQLite's built-in lock wait (`busy_timeout`) replaces siegelense's lock file. A newer format writes a new file instead of corrupting an older version's file. |
| When D lands                            | After chronicle-llm raises `engines` to Node `>=22.16`.                                                                                                                                 | Ward is published. `node:sqlite` with `busy_timeout` needs Node 22.16. Until D, ward keeps `ward.concurrency`.                                                |
| Siegelense's own registry               | It stays in siegelense, per home, with its lane fields. Siegelense also takes one generic lease per running instance in the machine-wide registry.                                      | Lane fields mean nothing to ward. The orchestrator's lane code keeps working unchanged.                                                                       |
| Slow-test limits                        | They stay fixed. The governor (§4, D) throttles concurrency to keep tests under them.                                                                                                   | The limits exist to catch slow tests. Raising them under load hides real slowness.                                                                            |
| New package name                        | `@dungeonmaster/load-balancer`                                                                                                                                                          | The name the original proposal chose                                                                                                                          |

## 4. The units

### Unit A — Shared work queue and longest-job-first

**Before:** the pool deals packages round-robin in discovery order. Web starts late and runs alone at the end.

**After:**

1. A new queue-based pool in `@dungeonmaster/shared` transformers: every worker pulls the next item from one shared queue, and results keep input order. `promisePoolTransformer` has two callers: ward's
   `multiPackageLayerBroker` and `scanRunBroker`. Both move to the new behaviour.
2. After each run, the parent ward writes each package's duration per check type into a small history file,
   `.ward/history/durations.json`, in the main checkout.
3. Before dispatching, the parent sorts packages by predicted total duration, longest first, for the check types this run will execute. A package with no history goes first, since it could be the longest.
4. Only full-package runs update history. A file-scoped run or an `--onlyTests` run never writes it, because its times are not the package's real cost.

**Expected
result:** a full run drops from 980s to about 485s. That is 1,940s of work over 4 workers, with web started at second 0.

### Unit B — Web e2e sharding

**Before:** one Playwright process runs all 132 spec files on one worker, in 336s.

**After:**

1. `check-run-e2e-broker` starts N Playwright processes at once, each with `--shard=i/N`, its own free port pair, its own JSON report and its own output folder.
2. All shards use the one prebuilt UI bundle. Ward builds it once, before the shards start.
3. Ward merges the shard reports into one result: failures, passing tests, per-file timings and open handles.
4. N comes from a new `.dungeonmaster.json` key, `ward.e2eShards`, default 3, in `packages/config`. N is never more than the number of spec files in the run, so a file-scoped run of 1 spec starts 1 process.
5. Each shard's servers are killed when that shard ends.

**Expected
result:** web's longest path drops from 451s to about 227s (115s of other checks plus 336s ÷ 3). The full run drops to about 430s.

**Risk to
watch:** 3 shards mean 3 browsers and 6 servers at once. The e2e slow-test limit is 20s. Unit B's manual tests must show no new slow-test failures at the default shard count.

### Unit D — Machine-wide load balancing (after chronicle-llm's Node change)

**Before:** ward runs a fixed number of packages no matter what else the machine is doing. Two agents running ward together trip the slow-test gate.

**After:**

1. **New package `@dungeonmaster/load-balancer`.** It holds:
    - the machine readers, moved from siegelense
    - the live registry at `~/.dungeonmaster/load/registry-v1.db`
    - a lease API: take a lease, heartbeat it, release it, and drop leases whose heartbeat went stale
    - a capacity suggestion, generalised from siegelense's capacity transformer. It takes the machine reading, the live leases, and the caller's own history of memory and CPU per job.
2. **Ward:**
    - The parent takes a lease for each package child it starts, and releases it when the child ends.
    - Before each dispatch, the parent asks for capacity, so concurrency can change during the run.
    - Unit B's shard count comes from the same capacity answer.
    - History adds peak memory (RSS) and CPU time per package and check type, next to Unit A's durations.
3. **Siegelense:**
    - imports the machine readers from the new package
    - takes a lease per running instance
    - counts other tools' leases when it computes capacity
    - keeps its own registry, profiles and snapshots unchanged
4.
**Orchestrator:** no change. It still calls siegelense's capacity. The Claude agents it spawns take no leases. Ward sees their load only through the machine reading: load average and free memory.

**Expected
result:** two agents running ward at once both pass without slow-test failures. A full run on an idle machine can use more than 4 workers when history shows they fit. On this 12-core machine that is an estimated 300s at 6 workers, to confirm by measurement.

## 5. Not doing, and why

### Check result caching (the proposal's "check result fingerprint snapshotting")

The proposal skipped a package's check when a hash of its inputs matched an earlier pass. It is dropped:

| Reason                                                                                                          | Measurement or evidence                                                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| Full runs are rare, and scoped runs are already fast.                                                           | Of the 96 run files in `.ward/` from the last 2 days, 2 were bare full runs.                                                                             |
| A shared edit invalidates almost everything anyway.                                                             | Since 2026-09-01, 327 of 1,683 commits touched `packages/shared`, which nearly every package depends on. Another 283 commits touched 3 or more packages. |
| The cache key is never complete, and each gap is a stale pass.                                                  | web's e2e boots `packages/server`, which web does not depend on. Integration tests spawn other packages' programs.                                       |
| It hides flaky tests.                                                                                           | A test that passes 1 time in 3 is cached on a lucky run and stays green until its inputs change.                                                         |
| Cached packages are never re-timed, so the slow-test gate goes blind to them.                                   |                                                                                                                                                          |
| The pre-merge regression pass is the run the cache would help most, and it is where a skip is least acceptable. |                                                                                                                                                          |

It can come back as its own proposal if full runs become frequent.

### Per-worker homes with snapshot-restore resets for e2e

The proposal gave each Playwright worker its own home and reset it from a snapshot before each test. It is dropped:

- Each worker would need its own API and Vite servers. Playwright's `webServer` starts once per run, not once per worker.
- A file restore does not reset the server's in-memory dispatcher.
- `scrolls/chronicle-llm/followup-home-state-to-db.md` moves home state into SQLite, and copying a live SQLite file under a running server is unsafe.

Sharding (Unit B) gets the same parallelism with none of these problems.

## 6. Acceptance criteria

| Unit | Criterion                                                                                                   |
|------|-------------------------------------------------------------------------------------------------------------|
| A    | A full `npm run ward` passes, and web's child starts in the first dispatch wave.                            |
| A    | A worker that finishes early takes the next package; no worker is idle while packages are still queued.     |
| A    | `.ward/history/durations.json` exists in the main checkout after a full run, and a worktree's run reads it. |
| A    | A full run is under 600s on this machine. The estimate is about 485s.                                       |
| B    | A full web e2e passes with 3 shards and no new slow-test failures.                                          |
| B    | A file-scoped e2e run of one spec starts exactly one Playwright process.                                    |
| B    | A failing test in shard 2 shows up in ward's output and `detail` exactly as a failure does today.           |
| B    | No server is left listening on any shard's ports after the run.                                             |
| D    | Two `npm run ward` runs started together both pass. While they run, the registry shows both runs' leases.   |
| D    | A siegelense lane and a ward run started together see each other's leases.                                  |
| D    | `DUNGEONMASTER_LOAD_DIR` keeps every test away from `~/.dungeonmaster/load/`.                               |
| D    | Killing a ward run with SIGKILL leaves leases that drop out once their heartbeat goes stale.                |
