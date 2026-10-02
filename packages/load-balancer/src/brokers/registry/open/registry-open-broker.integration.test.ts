import { existsSync, mkdtempSync, rmSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { deleteEnv, setEnv } from '#gateway/node/process';
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
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'durations'")
      .all();
    const tables = rawTables.map((row) => ({ ...row }));

    const rawIndices = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_durations_lookup'",
      )
      .all();
    const indices = rawIndices.map((row) => ({ ...row }));

    database
      .prepare(
        'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run('/test-repo', '@scope/test-pkg', 'unit', 4200, 512, 2, 1790976000000);

    database.close();

    const reopenedDatabase = registryOpenBroker();
    const rawRows = reopenedDatabase.prepare('SELECT * FROM durations').all();
    const rows = rawRows.map((row) => ({ ...row }));

    reopenedDatabase.close();

    rmSync(tempDir, { recursive: true, force: true });
    deleteEnv(loadBalancerStatics.registry.dirEnvVar);

    expect(fileExists).toBe(true);
    expect(tables).toStrictEqual([{ name: 'durations' }]);
    expect(indices).toStrictEqual([{ name: 'idx_durations_lookup' }]);
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
  });
});
