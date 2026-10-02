import { ensureDirSyncProxy } from '#gateway/node/fs/ensure-dir-sync/ensure-dir-sync.proxy';
import { homedir } from '#gateway/node/os';
import { dirname } from '#gateway/node/path';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { openSqliteDatabaseProxy } from '#gateway/node/sqlite/open-sqlite-database/open-sqlite-database.proxy';
import type { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;

export const registryOpenBrokerProxy = (): {
  setupDatabase: (params: { filePath: string; database: DatabaseSync }) => void;
  setupDatabaseThrows: (params: { filePath: string; error: Error }) => void;
  setupEnsureDirThrows: (params: { path: string; error: Error }) => void;
  setupHomeDir: (params: { homeDir: string }) => void;
  setupEnv: (params: { name: string; value: string | undefined }) => void;
  getOpenCallsFor: (params: { filePath: string }) => readonly unknown[][];
  getEnsureDirCallsFor: (params: { path: string }) => unknown[][];
} => {
  const ensureDirProxy = ensureDirSyncProxy();
  const openSqliteProxy = openSqliteDatabaseProxy();
  const envProxy = getEnvProxy();

  const realOs = requireActual<{ homedir: typeof homedir }>({ module: 'os' });
  const homedirHandle = registerMock({ fn: homedir });
  homedirHandle.calledWith([]).implement(() => realOs.homedir());

  return {
    setupDatabase: ({ filePath, database }: { filePath: string; database: DatabaseSync }): void => {
      ensureDirProxy.succeeds({ path: dirname(filePath) });
      openSqliteProxy.returns({ filePath, database });
    },
    setupDatabaseThrows: ({ filePath, error }: { filePath: string; error: Error }): void => {
      ensureDirProxy.succeeds({ path: dirname(filePath) });
      openSqliteProxy.throws({ filePath, error });
    },
    setupEnsureDirThrows: ({ path, error }: { path: string; error: Error }): void => {
      ensureDirProxy.throws({ path, error });
    },
    setupHomeDir: ({ homeDir }: { homeDir: string }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
    },
    setupEnv: ({ name, value }: { name: string; value: string | undefined }): void => {
      envProxy.setupEnv({ name, value });
    },
    getOpenCallsFor: ({ filePath }: { filePath: string }) =>
      openSqliteProxy.getCallsFor({ filePath }),
    getEnsureDirCallsFor: ({ path }: { path: string }) => ensureDirProxy.calls({ path }),
  };
};
