import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { registryOpenBrokerProxy } from '@dungeonmaster/load-balancer/brokers/registry/open/registry-open-broker.proxy';

import type { DurationSampleStub } from '../../../contracts/duration-sample/duration-sample.stub';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;
type DurationSample = ReturnType<typeof DurationSampleStub>;

export const historyReadBrokerProxy = (): {
  setupDatabase: (params?: { database: DatabaseSync }) => { database: DatabaseSync };
  setupSamples: (params: { samples: readonly DurationSample[] }) => void;
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
    setupSamples: ({ samples }: { samples: readonly DurationSample[] }): void => {
      const database = DatabaseSyncStub();
      initSchema(database);
      const insert = database.prepare(
        'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?);',
      );
      for (const sample of samples) {
        insert.run(
          sample.repoRoot,
          sample.packageName,
          sample.checkType,
          sample.durationMs,
          sample.peakRssMB,
          sample.shards,
          sample.recordedAtMs,
        );
      }
      registryOpenProxy.setupDatabase({ filePath: mockFilePath, database });
    },
    setupThrows: ({ error }: { error: Error }): void => {
      registryOpenProxy.setupDatabaseThrows({ filePath: mockFilePath, error });
    },
  };
};
