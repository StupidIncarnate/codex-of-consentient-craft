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
