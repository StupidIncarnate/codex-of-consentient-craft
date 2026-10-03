# @dungeonmaster/load-balancer

Load balancer and registry storage for parallel execution, capacity management, and test run history.

## Registry Storage

The SQLite registry lives at `~/.dungeonmaster/load/registry-v1.db` (also referenced as `~/.dungeonmaster/registry.sqlite3`).

### Environment Override

`process.env.DUNGEONMASTER_LOAD_DIR` overrides the directory where the registry database lives. During tests and in isolated environments, `jest.setup-global.js` points this variable to an isolated temporary directory within the jest sandbox so tests never modify `~/.dungeonmaster/load/`.

### Schema and Tables

All callers open the database through `registryOpenBroker` from `@dungeonmaster/load-balancer/brokers`.
The database holds:
- `durations`: `(repo_root TEXT, package TEXT, check_type TEXT, duration_ms INTEGER, peak_rss_mb INTEGER NULL, shards INTEGER NULL, recorded_at_ms INTEGER)` with an index on `(repo_root, package, check_type, recorded_at_ms)`.
- `leases`: `(lease_id TEXT PRIMARY KEY, tool TEXT, label TEXT, owner_pid INTEGER, state TEXT, expected_peak_mb INTEGER NULL, current_rss_mb INTEGER NULL, started_at_ms INTEGER, last_beat_ms INTEGER)` with an index on `(tool, state)`.

## Leases

A lease is an active claim on machine capacity:
- `tool`: `'ward' | 'siegelense'`
- `label`: package name or instance identifier
- `ownerPid`: pid of the process holding capacity
- `state`: `'starting' | 'running'`
- `expectedPeakMB`: predicted peak RSS in MB, or null
- `currentRssMB`: measured current RSS in MB, or null
- `startedAtMs`: timestamp when the lease was taken
- `lastBeatMs`: timestamp of the last heartbeat

### Who Takes Leases

- **Ward child processes**: per package being checked, owned by each child pid.
- **Siegelense instances**: per test lane or run.

### Liveness Checks and Heartbeats

Active leases are inspected and reaped by `leaseListLiveBroker` using two mechanisms:
1. **Pid liveness check (`kill(pid, 0)`)**: reaps the lease immediately when the owning process exits or crashes.
2. **Heartbeat (`leaseBeatBroker`)**: marks a lease stale after 30 seconds (`loadBalancerStatics.lease.staleAfterMs`). This handles ungraceful termination or cross-container pid recycling where pid liveness might be ambiguous.

## CPU Capacity, Headroom, and Ramp-Up

Dungeonmaster manages CPU allocation through capacity suggestions, headroom reservation, and gradual pool ramp-up.

### Headroom Protection

CPU headroom is configured via `loadBalancerStatics.cpu.headroomCores` (default `1`). The balancer always leaves at least 1 core unallocated for the operating system, IDE, and user workflows.

### Capacity Estimation

`capacitySuggestTransformer` calculates the target allowable cores by clamping available cores to `maxCpuPercent` (default 75%, configured under `resources.maxCpuPercent` in `~/.dungeonmaster/config.json`) and reserving `headroomCores`:

```typescript
const targetCores = Math.max(
  loadBalancerStatics.cpu.minAllowed,
  Math.min(
    machine.cores - loadBalancerStatics.cpu.headroomCores,
    Math.floor((machine.cores * maxCpuPercent) / PERCENT_DIVISOR),
  ),
);
```

The transformer derives `cpuLimit` by subtracting the 1-minute load average (`loadAvg1`) and recent in-flight leases from `targetCores`, bounded below by `loadBalancerStatics.cpu.minAllowed` (1 core).

### CPU Ramp-Up

To avoid CPU spikes at dispatch start, `loadBalancerStatics.cpu.ramp` defines a stepped concurrency warmup:
- `initialLimit`: 2 concurrent items
- `stepIntervalMs`: 2000 ms per step
- `stepCount`: 1 additional item per step

Consumers such as ward's `multiPackageLayerBroker` combine the ramp limit with the dynamic capacity limit:

```typescript
const elapsedMs = nowMs - runStartMs;
const steps = Math.floor(Math.max(0, elapsedMs) / loadBalancerStatics.cpu.ramp.stepIntervalMs);
const rampLimit = loadBalancerStatics.cpu.ramp.initialLimit + steps * loadBalancerStatics.cpu.ramp.stepCount;
const capacityLimit = inFlightCount + capacity.suggestion.suggestion;
return Math.max(1, Math.min(capacityLimit, rampLimit));
```

## Disk Budget

Dungeonmaster bounds its cumulative disk usage across repositories and temp environments to `maxDiskMB` (default 16384 MB / 16 GB), configured under `resources.maxDiskMB` in `~/.dungeonmaster/config.json`.

### Tracked Stores

Stores are scanned across the current repository, registered guilds in `config.json`, and user directories:
- **Repo stores**:
  - `ward-run-results`: `.ward/run-*.json` (newest per repo is protected)
  - `ward-bundle-cache`: `packages/*/.ward/bundle/*`
  - `e2e-test-results`: `test-results/*` (listening ports <24h old are protected)
  - `e2e-vite-cache`: `node_modules/.vite-*`
  - `e2e-playwright-reports`: `.ward-playwright-report-*.json`
- **User stores**:
  - `jest-transform-cache`: `/tmp/jest_*/*`
  - `e2e-sandboxes`: `/tmp/dm-e2e-*` (live PIDs are protected)
  - `jest-test-sandboxes`: `/tmp/dungeonmaster-jest-*` (live PIDs are protected)
  - `siegelense-sandboxes`: `/tmp/dm-siege-*` (active instances are protected)
  - `siegelense-evidence`: `<dungeonmasterHome>/siegelense/**/instances/*` (active instances and cited quests are protected)

### Protection Constraints

The budget enforcer (`diskBudgetEnforceBroker`) deletes the oldest eligible items first, but never touches:
- Active processes: folders with a live PID (`dm-e2e-<pid>`, `dungeonmaster-jest-<pid>`, active siegelense instances).
- Young items: items modified within `minAgeMs` (10 minutes).
- Repository head: the single newest ward run file in each repo (`newest-per-repo`).
- Active or recent test ports: ports listening or active within `orphanedPortTimeoutMs` (24 hours).
- Symlink traversal: symlinks are never followed out of their stores; only the link itself is counted or removed.

### Execution Cadence

- **Background pass**: executes after existing store-specific pruners (`storagePruneBroker`, `jestCachePruneBroker`) in `multiPackageLayerBroker` and `cleanupRunBroker`. Rate-limited to run at most once every `runEveryMs` (10 minutes).
- **Manual CLI pass**: `npm run ward -- --prune` or `npm run ward -- --prune all` prints an itemized inventory and eviction report.

