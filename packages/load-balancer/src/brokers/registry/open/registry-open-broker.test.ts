import { deleteEnv, setEnv } from '#gateway/node/process';
import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { registryOpenBroker } from './registry-open-broker';
import { registryOpenBrokerProxy } from './registry-open-broker.proxy';

describe('registryOpenBroker', () => {
  describe('environment variable is set', () => {
    it('VALID: {DUNGEONMASTER_LOAD_DIR} => resolves folder from env, ensures dir, and opens db', () => {
      const proxy = registryOpenBrokerProxy();
      const customFolder = '/custom/load-dir';
      const expectedDbPath = '/custom/load-dir/registry-v1.db';
      const stubDb = DatabaseSyncStub();

      proxy.setupDatabase({ filePath: expectedDbPath, database: stubDb });

      setEnv('DUNGEONMASTER_LOAD_DIR', customFolder);
      const database = registryOpenBroker();
      deleteEnv('DUNGEONMASTER_LOAD_DIR');

      expect(database).toBe(stubDb);
      expect(proxy.getEnsureDirCallsFor({ path: customFolder })).toStrictEqual([
        [customFolder, { recursive: true }],
      ]);
      expect(proxy.getOpenCallsFor({ filePath: expectedDbPath })).toStrictEqual([
        [{ filePath: expectedDbPath, busyTimeoutMs: 5000 }],
      ]);
    });

    it('VALID: {DUNGEONMASTER_LOAD_DIR} => creates table and index schema', () => {
      const proxy = registryOpenBrokerProxy();
      const customFolder = '/custom/load-dir';
      const expectedDbPath = '/custom/load-dir/registry-v1.db';
      const stubDb = DatabaseSyncStub();

      proxy.setupDatabase({ filePath: expectedDbPath, database: stubDb });

      setEnv('DUNGEONMASTER_LOAD_DIR', customFolder);
      const database = registryOpenBroker();
      deleteEnv('DUNGEONMASTER_LOAD_DIR');

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
          'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .run(
          'lease-unit-1',
          'ward',
          'unit-test',
          1234,
          'starting',
          512,
          256,
          1790900000000,
          1790900000000,
        );

      database.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('test-key', 'test-value');

      const rawLeaseRows = database
        .prepare('SELECT * FROM leases WHERE lease_id = ?')
        .all('lease-unit-1');
      const leaseRows = rawLeaseRows.map((row) => ({ ...row }));

      const rawMetaRows = database.prepare('SELECT * FROM meta WHERE key = ?').all('test-key');
      const metaRows = rawMetaRows.map((row) => ({ ...row }));

      expect(tables).toStrictEqual([{ name: 'durations' }, { name: 'leases' }, { name: 'meta' }]);
      expect(indices).toStrictEqual([
        { name: 'idx_durations_lookup' },
        { name: 'idx_leases_tool_state' },
      ]);
      expect(leaseRows).toStrictEqual([
        {
          lease_id: 'lease-unit-1',
          tool: 'ward',
          label: 'unit-test',
          owner_pid: 1234,
          state: 'starting',
          expected_peak_mb: 512,
          current_rss_mb: 256,
          started_at_ms: 1790900000000,
          last_beat_ms: 1790900000000,
        },
      ]);
      expect(metaRows).toStrictEqual([
        {
          key: 'test-key',
          value: 'test-value',
        },
      ]);
    });
  });

  describe('environment variable is unset', () => {
    it('VALID: {no env var} => resolves folder under homedir, ensures dir, and opens db', () => {
      const proxy = registryOpenBrokerProxy();
      const mockHome = '/home/mock-user';
      const expectedFolder = '/home/mock-user/.dungeonmaster/load';
      const expectedDbPath = '/home/mock-user/.dungeonmaster/load/registry-v1.db';
      const stubDb = DatabaseSyncStub();

      proxy.setupHomeDir({ homeDir: mockHome });
      proxy.setupDatabase({ filePath: expectedDbPath, database: stubDb });

      deleteEnv('DUNGEONMASTER_LOAD_DIR');
      const database = registryOpenBroker();

      expect(database).toBe(stubDb);
      expect(proxy.getEnsureDirCallsFor({ path: expectedFolder })).toStrictEqual([
        [expectedFolder, { recursive: true }],
      ]);
      expect(proxy.getOpenCallsFor({ filePath: expectedDbPath })).toStrictEqual([
        [{ filePath: expectedDbPath, busyTimeoutMs: 5000 }],
      ]);
    });
  });
});
