import { getAllProxy } from '#gateway/browser/indexedDB/get-all/get-all.proxy';
import { openStoreProxy } from '#gateway/browser/indexedDB/open-store/open-store.proxy';

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';
import { migrateLegacyRecordsLayerBrokerProxy } from './migrate-legacy-records-layer-broker.proxy';

const { name, version, storeName } = chatComposerStatics.draftDatabase;

// Every indexedDB proxy in a test shares one in-memory store per database and store name, so the
// records seeded here are the records the broker's open, read and rewrite all see.
export const draftImagesReadBrokerProxy = (): {
  seed: (params: { drafts: readonly unknown[] }) => void;
  getStoredDrafts: () => readonly unknown[];
  openFails: (params: { error: Error }) => void;
} => {
  const openProxy = openStoreProxy();
  getAllProxy();
  migrateLegacyRecordsLayerBrokerProxy();

  openProxy.seedExistingDatabase({ name, version });

  return {
    seed: ({ drafts }: { drafts: readonly unknown[] }): void => {
      openProxy.seedRecords({ name, storeName, records: drafts });
    },
    getStoredDrafts: (): readonly unknown[] => openProxy.getRecords({ name, storeName }),
    openFails: ({ error }: { error: Error }): void => {
      openProxy.seedOpenRefused({ name, version, message: error.message });
    },
  };
};
