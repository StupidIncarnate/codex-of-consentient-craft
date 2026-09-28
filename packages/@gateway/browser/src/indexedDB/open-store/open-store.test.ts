import { getAll } from '../get-all/get-all';
import { put } from '../put/put';
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

  describe('tolerant addressing', () => {
    it('VALID: {seedExistingDatabaseMatchingName, a predicate} => resolves for a database name the predicate accepts', async () => {
      const proxy = openStoreProxy();
      proxy.seedExistingDatabaseMatchingName({
        name: (value) => String(value).startsWith('chat-drafts'),
        version: 1,
      });

      const db = await openStore({
        name: 'chat-drafts-computed-at-runtime',
        version: 1,
        storeName: 'drafts',
      });

      expect(db.objectStoreNames.contains('drafts')).toBe(true);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual version', async () => {
      const proxy = openStoreProxy();
      proxy.seedExistingDatabase({ name: 'chat-drafts', version: 1 });

      await openStore({ name: 'chat-drafts', version: 1, storeName: 'drafts' });

      expect(proxy.getCallsFor({ name: 'chat-drafts' })).toStrictEqual([['chat-drafts', 1]]);
    });
  });

  describe('shared store', () => {
    it('VALID: {records seeded through the proxy} => the opened database reads and writes that same store', async () => {
      const proxy = openStoreProxy();
      proxy.seedExistingDatabase({ name: 'chat-drafts', version: 1 });
      proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['seeded'] });

      const db = await openStore({ name: 'chat-drafts', version: 1, storeName: 'drafts' });
      await put({ db, storeName: 'drafts', value: 'written' });
      const read = await getAll({ db, storeName: 'drafts' });

      expect(read).toStrictEqual(['seeded', 'written']);
      expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual([
        'seeded',
        'written',
      ]);
    });
  });
});
