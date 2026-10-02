# @dungeonmaster/load-balancer

Load balancer and registry storage for parallel execution, capacity management, and test run history.

## Registry Storage

The SQLite registry lives at `~/.dungeonmaster/load/registry-v1.db`.

### Environment Override
`process.env.DUNGEONMASTER_LOAD_DIR` overrides the directory where `registry-v1.db` is stored. During tests, `jest.setup-global.js` points this variable to an isolated temporary directory within the jest sandbox so tests never modify `~/.dungeonmaster/load/`.

### Schema and Tables
All callers open the database through `registryOpenBroker` from `@dungeonmaster/load-balancer/brokers`.
Each unit adds its own tables through `registryOpenBroker`:
- `durations`: `(repo_root TEXT, package TEXT, check_type TEXT, duration_ms INTEGER, peak_rss_mb INTEGER NULL, shards INTEGER NULL, recorded_at_ms INTEGER)` with an index on `(repo_root, package, check_type, recorded_at_ms)`.
