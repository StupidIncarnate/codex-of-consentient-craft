import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

import { migrateLegacyRecordsLayerAdapter } from './migrate-legacy-records-layer-adapter';
import { migrateLegacyRecordsLayerAdapterProxy } from './migrate-legacy-records-layer-adapter.proxy';

const { storeName } = chatComposerStatics.draftDatabase;

describe('migrateLegacyRecordsLayerAdapter', () => {
  it('VALID: {store holds one scopeKey-less legacy record} => tags it with the create scope, in place', async () => {
    const proxy = migrateLegacyRecordsLayerAdapterProxy();
    proxy.seed({
      drafts: [{ attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' }],
    });
    const db = await proxy.openDb();

    const result = await migrateLegacyRecordsLayerAdapter({ db, storeName });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getStoredDrafts()).toStrictEqual([
      { attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=', scopeKey: 'create' },
    ]);
  });

  it('EMPTY: {store holds only already-scoped records} => leaves them untouched, no legacy records to tag', async () => {
    const proxy = migrateLegacyRecordsLayerAdapterProxy();
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
    const db = await proxy.openDb();

    const result = await migrateLegacyRecordsLayerAdapter({ db, storeName });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getStoredDrafts()).toStrictEqual([
      {
        attachmentId: 'a',
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
        scopeKey: 'quest-a',
      },
    ]);
  });

  it('EMPTY: {empty store} => resolves without opening a write transaction', async () => {
    const proxy = migrateLegacyRecordsLayerAdapterProxy();
    const db = await proxy.openDb();

    const result = await migrateLegacyRecordsLayerAdapter({ db, storeName });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getStoredDrafts()).toStrictEqual([]);
  });

  it('VALID: {store holds [legacy, already-scoped]} => only the legacy record is tagged; the already-scoped one keeps ITS OWN scope', async () => {
    const proxy = migrateLegacyRecordsLayerAdapterProxy();
    proxy.seed({
      drafts: [
        { attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' },
        { attachmentId: 'b', mediaType: 'image/png', dataBase64: 'QUFBQQ==', scopeKey: 'quest-a' },
      ],
    });
    const db = await proxy.openDb();

    await migrateLegacyRecordsLayerAdapter({ db, storeName });

    expect(proxy.getStoredDrafts()).toStrictEqual([
      { attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=', scopeKey: 'create' },
      { attachmentId: 'b', mediaType: 'image/png', dataBase64: 'QUFBQQ==', scopeKey: 'quest-a' },
    ]);
  });
});
