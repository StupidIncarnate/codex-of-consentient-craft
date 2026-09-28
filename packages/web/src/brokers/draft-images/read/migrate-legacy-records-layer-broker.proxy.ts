import { getAllProxy } from '#gateway/browser/indexedDB/get-all/get-all.proxy';
import { replaceAllProxy } from '#gateway/browser/indexedDB/replace-all/replace-all.proxy';

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

const { name, storeName } = chatComposerStatics.draftDatabase;

export const migrateLegacyRecordsLayerBrokerProxy = (): {
  seed: (params: { drafts: readonly unknown[] }) => void;
  openDb: () => IDBDatabase;
  getStoredDrafts: () => readonly unknown[];
  getWriteTransactions: () => ReturnType<ReturnType<typeof replaceAllProxy>['getTransactionsFor']>;
} => {
  const readProxy = getAllProxy();
  const writeProxy = replaceAllProxy();

  return {
    seed: ({ drafts }: { drafts: readonly unknown[] }): void => {
      readProxy.seedRecords({ name, storeName, records: drafts });
    },
    openDb: (): IDBDatabase => readProxy.buildDb({ name }),
    getStoredDrafts: (): readonly unknown[] => readProxy.getRecords({ name, storeName }),
    getWriteTransactions: (): ReturnType<
      ReturnType<typeof replaceAllProxy>['getTransactionsFor']
    > => writeProxy.getTransactionsFor().filter(({ mode }) => mode === 'readwrite'),
  };
};
