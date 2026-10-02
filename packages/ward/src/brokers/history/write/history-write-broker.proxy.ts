import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { registryOpenBrokerProxy } from '@dungeonmaster/load-balancer/brokers/registry/open/registry-open-broker.proxy';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;

export const historyWriteBrokerProxy = (): {
  setupDatabase: (params?: { database: DatabaseSync }) => { database: DatabaseSync };
  setupThrows: (params: { error: Error }) => void;
} => {
  const registryOpenProxy = registryOpenBrokerProxy();
  const mockFilePath = '/mock/home/.dungeonmaster/load/registry-v1.db';

  registryOpenProxy.setupHomeDir({ homeDir: '/mock/home' });
  registryOpenProxy.setupEnv({ name: 'DUNGEONMASTER_LOAD_DIR', value: undefined });

  const initSchema = (db: DatabaseSync): void => {
    db.exec(
      'CREATE TABLE IF NOT EXISTS durations (repo_root TEXT, package TEXT, check_type TEXT, duration_ms INTEGER, peak_rss_mb INTEGER NULL, shards INTEGER NULL, recorded_at_ms INTEGER);',
    );
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_durations_lookup ON durations (repo_root, package, check_type, recorded_at_ms);',
    );
  };

  return {
    setupDatabase: (params?: { database: DatabaseSync }): { database: DatabaseSync } => {
      const database = params?.database ?? DatabaseSyncStub();
      initSchema(database);
      registryOpenProxy.setupDatabase({ filePath: mockFilePath, database });
      return { database };
    },
    setupThrows: ({ error }: { error: Error }): void => {
      registryOpenProxy.setupDatabaseThrows({ filePath: mockFilePath, error });
    },
  };
};
