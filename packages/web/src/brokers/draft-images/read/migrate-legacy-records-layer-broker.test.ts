import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

import { migrateLegacyRecordsLayerBroker } from './migrate-legacy-records-layer-broker';
import { migrateLegacyRecordsLayerBrokerProxy } from './migrate-legacy-records-layer-broker.proxy';

const { storeName } = chatComposerStatics.draftDatabase;

describe('migrateLegacyRecordsLayerBroker', () => {
  it('VALID: {store holds one scopeKey-less legacy record} => tags it with the create scope, in one write transaction', async () => {
    const proxy = migrateLegacyRecordsLayerBrokerProxy();
    proxy.seed({
      drafts: [{ attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' }],
    });
    const db = proxy.openDb();

    await expect(migrateLegacyRecordsLayerBroker({ db, storeName })).resolves.toBe(undefined);

    expect(proxy.getStoredDrafts()).toStrictEqual([
      { attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=', scopeKey: 'create' },
    ]);
    expect(proxy.getWriteTransactions()).toStrictEqual([
      { storeNames: [storeName], mode: 'readwrite', ops: ['getAll', 'clear', 'add'] },
    ]);
  });

  it('EMPTY: {store holds only already-scoped records} => leaves them untouched and opens no write transaction', async () => {
    const proxy = migrateLegacyRecordsLayerBrokerProxy();
    proxy.seed({
      drafts: [
        {
          attachmentId: 'a',
          mediaType: 'image/png',
          dataBase64: 'iVBORw0KGgo=',
          scopeKey: 'quest-a',
        },
      ],
    });
    const db = proxy.openDb();

    await expect(migrateLegacyRecordsLayerBroker({ db, storeName })).resolves.toBe(undefined);

    expect(proxy.getStoredDrafts()).toStrictEqual([
      {
        attachmentId: 'a',
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
        scopeKey: 'quest-a',
      },
    ]);
    expect(proxy.getWriteTransactions()).toStrictEqual([]);
  });

  it('EMPTY: {empty store} => resolves without opening a write transaction', async () => {
    const proxy = migrateLegacyRecordsLayerBrokerProxy();
    const db = proxy.openDb();

    await expect(migrateLegacyRecordsLayerBroker({ db, storeName })).resolves.toBe(undefined);

    expect(proxy.getStoredDrafts()).toStrictEqual([]);
    expect(proxy.getWriteTransactions()).toStrictEqual([]);
  });

  it('VALID: {store holds [legacy, already-scoped]} => only the legacy record is tagged; the already-scoped one keeps ITS OWN scope', async () => {
    const proxy = migrateLegacyRecordsLayerBrokerProxy();
    proxy.seed({
      drafts: [
        { attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' },
        { attachmentId: 'b', mediaType: 'image/png', dataBase64: 'QUFBQQ==', scopeKey: 'quest-a' },
      ],
    });
    const db = proxy.openDb();

    await migrateLegacyRecordsLayerBroker({ db, storeName });

    expect(proxy.getStoredDrafts()).toStrictEqual([
      { attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=', scopeKey: 'create' },
      { attachmentId: 'b', mediaType: 'image/png', dataBase64: 'QUFBQQ==', scopeKey: 'quest-a' },
    ]);
  });
});
