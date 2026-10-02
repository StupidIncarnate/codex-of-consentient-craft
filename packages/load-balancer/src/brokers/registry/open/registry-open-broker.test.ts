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
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'durations'")
        .all();
      const tables = rawTables.map((row) => ({ ...row }));

      const rawIndices = database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_durations_lookup'",
        )
        .all();
      const indices = rawIndices.map((row) => ({ ...row }));

      expect(tables).toStrictEqual([{ name: 'durations' }]);
      expect(indices).toStrictEqual([{ name: 'idx_durations_lookup' }]);
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
