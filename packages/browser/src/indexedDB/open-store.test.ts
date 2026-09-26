import { openStore } from './open-store';
import { openStoreProxy } from './open-store.proxy';

describe('openStore', () => {
  it('VALID: {database already at version, store present} => resolves with no heal', async () => {
    const proxy = openStoreProxy();
    proxy.seedExistingDatabase({ name: 'chat-drafts', version: 1 });

    const db = await openStore({ name: 'chat-drafts', version: 1, storeName: 'drafts' });

    expect(db.objectStoreNames.contains('drafts')).toBe(true);
  });

  it('EDGE: {database at version but missing the store} => reopens one version ahead and recreates it', async () => {
    const proxy = openStoreProxy();
    proxy.seedDatabaseMissingStore({ name: 'chat-drafts', version: 1 });

    const db = await openStore({ name: 'chat-drafts', version: 1, storeName: 'drafts' });

    expect(db.objectStoreNames.contains('drafts')).toBe(true);
  });

  it('EDGE: {requested version is now stale, VersionError} => falls back to a version-less open', async () => {
    const proxy = openStoreProxy();
    proxy.seedStaleVersionRequest({ name: 'chat-drafts', version: 1 });

    const db = await openStore({ name: 'chat-drafts', version: 1, storeName: 'drafts' });

    expect(db.objectStoreNames.contains('drafts')).toBe(true);
  });

  it('ERROR: {open refused outright} => rejects with the real error message', async () => {
    const proxy = openStoreProxy();
    proxy.seedOpenRefused({ name: 'chat-drafts', version: 1, message: 'blocked by another tab' });

    await expect(
      openStore({ name: 'chat-drafts', version: 1, storeName: 'drafts' }),
    ).rejects.toThrow(/openStore: failed to open chat-drafts — blocked by another tab/u);
  });
});
