import { existsSync, mkdtempSync, rmSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { deleteEnv, setEnv } from '#gateway/node/process';
import { openSqliteDatabase } from '#gateway/node/sqlite';
import { loadBalancerStatics } from '../../../statics/load-balancer/load-balancer-statics';
import { registryOpenBroker } from './registry-open-broker';

describe('registryOpenBroker integration', () => {
  it('VALID: {temp directory} => creates database file and schema, preserves data on reopen', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'load-balancer-registry-test-'));

    setEnv(loadBalancerStatics.registry.dirEnvVar, tempDir);

    const database = registryOpenBroker();
    const expectedDbPath = join(tempDir, loadBalancerStatics.registry.fileName);

    const fileExists = existsSync(expectedDbPath);

    const rawTables = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('durations', 'leases', 'meta') ORDER BY name ASC",
      )
      .all();
    const tables = rawTables.map((row) => ({ ...row }));

    const rawIndices = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('idx_durations_lookup', 'idx_leases_tool_state') ORDER BY name ASC",
      )
      .all();
    const indices = rawIndices.map((row) => ({ ...row }));

    database
      .prepare(
        'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run('/test-repo', '@scope/test-pkg', 'unit', 4200, 512, 2, 1790976000000);

    database
      .prepare(
        'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        'lease-reopen-1',
        'ward',
        '@scope/test-pkg',
        2345,
        'starting',
        null,
        null,
        1790976000000,
        1790976000000,
      );

    database.close();

    const reopenedDatabase = registryOpenBroker();
    const rawRows = reopenedDatabase.prepare('SELECT * FROM durations').all();
    const rows = rawRows.map((row) => ({ ...row }));

    const rawLeaseRows = reopenedDatabase.prepare('SELECT * FROM leases').all();
    const leaseRows = rawLeaseRows.map((row) => ({ ...row }));

    reopenedDatabase.close();

    rmSync(tempDir, { recursive: true, force: true });
    deleteEnv(loadBalancerStatics.registry.dirEnvVar);

    expect(fileExists).toBe(true);
    expect(tables).toStrictEqual([{ name: 'durations' }, { name: 'leases' }, { name: 'meta' }]);
    expect(indices).toStrictEqual([
      { name: 'idx_durations_lookup' },
      { name: 'idx_leases_tool_state' },
    ]);
    expect(rows).toStrictEqual([
      {
        repo_root: '/test-repo',
        package: '@scope/test-pkg',
        check_type: 'unit',
        duration_ms: 4200,
        peak_rss_mb: 512,
        shards: 2,
        recorded_at_ms: 1790976000000,
      },
    ]);
    expect(leaseRows).toStrictEqual([
      {
        lease_id: 'lease-reopen-1',
        tool: 'ward',
        label: '@scope/test-pkg',
        owner_pid: 2345,
        state: 'starting',
        expected_peak_mb: null,
        current_rss_mb: null,
        started_at_ms: 1790976000000,
        last_beat_ms: 1790976000000,
      },
    ]);
  });

  it('VALID: {database with durations only} => creates leases table, preserves existing durations and allows lease operations', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'load-balancer-migration-test-'));

    setEnv(loadBalancerStatics.registry.dirEnvVar, tempDir);

    const initialDbPath = join(tempDir, loadBalancerStatics.registry.fileName);
    const initialDb = openSqliteDatabase({
      filePath: initialDbPath,
      busyTimeoutMs: loadBalancerStatics.registry.busyTimeoutMs,
    });

    initialDb.exec(
      'CREATE TABLE IF NOT EXISTS durations (repo_root TEXT, package TEXT, check_type TEXT, duration_ms INTEGER, peak_rss_mb INTEGER NULL, shards INTEGER NULL, recorded_at_ms INTEGER);',
    );
    initialDb.exec(
      'CREATE INDEX IF NOT EXISTS idx_durations_lookup ON durations (repo_root, package, check_type, recorded_at_ms);',
    );
    initialDb
      .prepare(
        'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run('/legacy-repo', '@scope/legacy-pkg', 'lint', 1500, null, null, 1790900000000);
    initialDb.close();

    const migratedDatabase = registryOpenBroker();

    const rawTables = migratedDatabase
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('durations', 'leases', 'meta') ORDER BY name ASC",
      )
      .all();
    const tables = rawTables.map((row) => ({ ...row }));

    const rawIndices = migratedDatabase
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('idx_durations_lookup', 'idx_leases_tool_state') ORDER BY name ASC",
      )
      .all();
    const indices = rawIndices.map((row) => ({ ...row }));

    const rawDurations = migratedDatabase.prepare('SELECT * FROM durations').all();
    const durations = rawDurations.map((row) => ({ ...row }));

    migratedDatabase
      .prepare(
        'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        'lease-migrated-1',
        'ward',
        '@scope/legacy-pkg',
        3456,
        'running',
        1024,
        512,
        1790900005000,
        1790900005000,
      );

    const rawLeases = migratedDatabase
      .prepare('SELECT * FROM leases WHERE lease_id = ?')
      .all('lease-migrated-1');
    const leases = rawLeases.map((row) => ({ ...row }));

    migratedDatabase.close();

    rmSync(tempDir, { recursive: true, force: true });
    deleteEnv(loadBalancerStatics.registry.dirEnvVar);

    expect(tables).toStrictEqual([{ name: 'durations' }, { name: 'leases' }, { name: 'meta' }]);
    expect(indices).toStrictEqual([
      { name: 'idx_durations_lookup' },
      { name: 'idx_leases_tool_state' },
    ]);
    expect(durations).toStrictEqual([
      {
        repo_root: '/legacy-repo',
        package: '@scope/legacy-pkg',
        check_type: 'lint',
        duration_ms: 1500,
        peak_rss_mb: null,
        shards: null,
        recorded_at_ms: 1790900000000,
      },
    ]);
    expect(leases).toStrictEqual([
      {
        lease_id: 'lease-migrated-1',
        tool: 'ward',
        label: '@scope/legacy-pkg',
        owner_pid: 3456,
        state: 'running',
        expected_peak_mb: 1024,
        current_rss_mb: 512,
        started_at_ms: 1790900005000,
        last_beat_ms: 1790900005000,
      },
    ]);
  });
});
