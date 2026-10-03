import { randomUUID } from '#gateway/node/crypto';
import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { registryOpenBrokerProxy } from '../../registry/open/registry-open-broker.proxy';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;

const initSchema = (database: DatabaseSync): void => {
  database.exec(
    'CREATE TABLE IF NOT EXISTS leases (lease_id TEXT PRIMARY KEY, tool TEXT, label TEXT, owner_pid INTEGER, state TEXT, expected_peak_mb INTEGER NULL, current_rss_mb INTEGER NULL, started_at_ms INTEGER, last_beat_ms INTEGER);',
  );
  database.exec('CREATE INDEX IF NOT EXISTS idx_leases_tool_state ON leases (tool, state);');
};

export const leaseTakeBrokerProxy = (): {
  setupDatabase: (params?: { database?: DatabaseSync; homeDir?: string }) => {
    database: DatabaseSync;
  };
  setupUuid: (params: { uuid: string }) => void;
} => {
  const registryOpenProxy = registryOpenBrokerProxy();

  registryOpenProxy.setupHomeDir({ homeDir: '/mock/home' });
  registryOpenProxy.setupEnv({ name: 'DUNGEONMASTER_LOAD_DIR', value: undefined });

  const realCrypto = requireActual<{ randomUUID: typeof randomUUID }>({ module: 'crypto' });
  const uuidHandle = registerMock({ fn: randomUUID });
  uuidHandle.calledWith([]).implement(() => realCrypto.randomUUID());

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
    setupUuid: ({ uuid }: { uuid: string }): void => {
      uuidHandle.calledWith([]).returns(uuid);
    },
  };
};
