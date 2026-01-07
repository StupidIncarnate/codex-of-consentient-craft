import { lowdbDatabaseAdapterProxy } from '../../../adapters/lowdb/database/lowdb-database-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { QuestDatabase } from '../../../contracts/quest-database/quest-database-contract';

export const questModifyBrokerProxy = (): {
  setupQuestFound: (params: { dbPath: FilePath; database: QuestDatabase }) => void;
  setupEmptyDatabase: (params: { dbPath: FilePath }) => void;
  getCapturedDatabase: () => QuestDatabase | undefined;
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
      dbProxy.writesDatabase({ dbPath });
    },

    setupEmptyDatabase: ({ dbPath }: { dbPath: FilePath }): void => {
      dbProxy.readsEmptyDatabase({ dbPath });
      dbProxy.writesDatabase({ dbPath });
    },

    getCapturedDatabase: (): QuestDatabase | undefined => dbProxy.getCapturedDatabase(),
  };
};
