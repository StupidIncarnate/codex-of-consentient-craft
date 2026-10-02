import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { registryOpenBrokerProxy } from '../../registry/open/registry-open-broker.proxy';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;

const initSchema = (database: DatabaseSync): void => {
  database.exec(
    'CREATE TABLE IF NOT EXISTS leases (lease_id TEXT PRIMARY KEY, tool TEXT, label TEXT, owner_pid INTEGER, state TEXT, expected_peak_mb INTEGER NULL, current_rss_mb INTEGER NULL, started_at_ms INTEGER, last_beat_ms INTEGER);',
  );
  database.exec('CREATE INDEX IF NOT EXISTS idx_leases_tool_state ON leases (tool, state);');
};

export const leaseReleaseBrokerProxy = (): {
  setupDatabase: (params?: { database: DatabaseSync }) => { database: DatabaseSync };
} => {
  const registryOpenProxy = registryOpenBrokerProxy();
  const mockFilePath = '/mock/home/.dungeonmaster/load/registry-v1.db';

  registryOpenProxy.setupHomeDir({ homeDir: '/mock/home' });
  registryOpenProxy.setupEnv({ name: 'DUNGEONMASTER_LOAD_DIR', value: undefined });

  return {
    setupDatabase: (params?: { database: DatabaseSync }): { database: DatabaseSync } => {
      const database = params?.database ?? DatabaseSyncStub();
      initSchema(database);
      registryOpenProxy.setupDatabase({ filePath: mockFilePath, database });
      return { database };
    },
  };
};
