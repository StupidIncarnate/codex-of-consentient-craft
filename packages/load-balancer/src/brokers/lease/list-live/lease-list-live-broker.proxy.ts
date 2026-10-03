import { killProxy } from '#gateway/node/process/kill/kill.proxy';
import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { registryOpenBrokerProxy } from '../../registry/open/registry-open-broker.proxy';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;

const initSchema = (database: DatabaseSync): void => {
  database.exec(
    'CREATE TABLE IF NOT EXISTS leases (lease_id TEXT PRIMARY KEY, tool TEXT, label TEXT, owner_pid INTEGER, state TEXT, expected_peak_mb INTEGER NULL, current_rss_mb INTEGER NULL, started_at_ms INTEGER, last_beat_ms INTEGER);',
  );
  database.exec('CREATE INDEX IF NOT EXISTS idx_leases_tool_state ON leases (tool, state);');
};

export const leaseListLiveBrokerProxy = (): {
  setupDatabase: (params?: { database?: DatabaseSync; homeDir?: string }) => {
    database: DatabaseSync;
  };
  setupProcessAlive: (params: { pid: number }) => void;
  setupProcessDead: (params: { pid: number }) => void;
  setupProcessPermissionDenied: (params: { pid: number }) => void;
  setupProcessThrowsUnknown: (params: { pid: number }) => void;
} => {
  const registryOpenProxy = registryOpenBrokerProxy();
  const procKillProxy = killProxy();

  registryOpenProxy.setupHomeDir({ homeDir: '/mock/home' });
  registryOpenProxy.setupEnv({ name: 'DUNGEONMASTER_LOAD_DIR', value: undefined });

  return {
    setupDatabase: (params?: {
      database?: DatabaseSync;
      homeDir?: string;
    }): { database: DatabaseSync } => {
      const database = params?.database ?? DatabaseSyncStub();
      initSchema(database);
      const homeDir = params?.homeDir ?? '/mock/home';
      const filePath = `${homeDir}/.dungeonmaster/load/registry-v1.db`;
      registryOpenProxy.setupHomeDir({ homeDir });
      registryOpenProxy.setupDatabase({ filePath, database });
      if (homeDir !== '/home/user') {
        registryOpenProxy.setupDatabase({
          filePath: '/home/user/.dungeonmaster/load/registry-v1.db',
          database,
        });
      }
      return { database };
    },
    setupProcessAlive: ({ pid }: { pid: number }): void => {
      procKillProxy.setupSent({ pid, signal: 0 });
    },
    setupProcessDead: ({ pid }: { pid: number }): void => {
      procKillProxy.setupNotFound({ pid, signal: 0 });
    },
    setupProcessPermissionDenied: ({ pid }: { pid: number }): void => {
      procKillProxy.setupPermissionDenied({ pid, signal: 0 });
    },
    setupProcessThrowsUnknown: ({ pid }: { pid: number }): void => {
      procKillProxy.setupInvalidSignal({ pid, signal: 0 });
    },
  };
};
