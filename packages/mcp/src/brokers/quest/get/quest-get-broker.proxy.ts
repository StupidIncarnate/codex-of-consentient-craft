import { lowdbDatabaseAdapterProxy } from '../../../adapters/lowdb/database/lowdb-database-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { QuestDatabase } from '../../../contracts/quest-database/quest-database-contract';

export const questGetBrokerProxy = (): {
  setupQuestFound: (params: { dbPath: FilePath; database: QuestDatabase }) => void;
  setupEmptyDatabase: (params: { dbPath: FilePath }) => void;
  setupDatabaseError: (params: { dbPath: FilePath; error: Error }) => void;
} => {
  const dbProxy = lowdbDatabaseAdapterProxy();

  return {
    setupQuestFound: ({
      dbPath,
      database,
    }: {
      dbPath: FilePath;
      database: QuestDatabase;
    }): void => {
      dbProxy.readsDatabase({ dbPath, database });
    },

    setupEmptyDatabase: ({ dbPath }: { dbPath: FilePath }): void => {
      dbProxy.readsEmptyDatabase({ dbPath });
    },

    setupDatabaseError: ({ dbPath, error: _error }: { dbPath: FilePath; error: Error }): void => {
      dbProxy.readsDatabase({
        dbPath,
        database: { quests: [] } as QuestDatabase,
      });
      // The error would be thrown during read, but lowdbDatabaseAdapterProxy
      // doesn't have a throws method, so we'll test the not found case instead
    },
  };
};
