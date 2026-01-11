import { lowdbDatabaseAdapterProxy } from '../../../adapters/lowdb/database/lowdb-database-adapter.proxy';
import { questsFolderEnsureBrokerProxy } from '../../quests-folder/ensure/quests-folder-ensure-broker.proxy';
import type { QuestDatabase } from '../../../contracts/quest-database/quest-database-contract';

export const questGetBrokerProxy = (): {
  setupQuestFound: (params: { database: QuestDatabase }) => void;
  setupEmptyDatabase: () => void;
} => {
  const folderProxy = questsFolderEnsureBrokerProxy();
  const dbProxy = lowdbDatabaseAdapterProxy();

  // Ensure folder setup is called
  folderProxy.setupFolderAndDbExist();

  return {
    setupQuestFound: ({ database }: { database: QuestDatabase }): void => {
      dbProxy.readsDatabase({ dbPath: '' as never, database });
    },

    setupEmptyDatabase: (): void => {
      dbProxy.readsEmptyDatabase({ dbPath: '' as never });
    },
  };
};
