import { getAll } from './get-all';
import { getAllProxy } from './get-all.proxy';

describe('getAll', () => {
  it('VALID: {store holds records} => resolves them in insertion order', async () => {
    const proxy = getAllProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['first', 'second'] });
    const db = proxy.buildDb({ name: 'chat-drafts' });

    const result = await getAll({ db, storeName: 'drafts' });

    expect(result).toStrictEqual(['first', 'second']);
  });

  it('EMPTY: {store never seeded} => resolves []', async () => {
    const proxy = getAllProxy();
    const db = proxy.buildDb({ name: 'chat-drafts' });

    const result = await getAll({ db, storeName: 'drafts' });

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {two stores in one database} => each read sees only its own store', async () => {
    const proxy = getAllProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['draft'] });
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'images', records: ['image'] });
    const db = proxy.buildDb({ name: 'chat-drafts' });

    const result = await getAll({ db, storeName: 'images' });

    expect(result).toStrictEqual(['image']);
  });

  it('ERROR: {read transaction fails} => rejects naming the store and the real error', async () => {
    const proxy = getAllProxy();
    const db = proxy.buildFailingDb({ name: 'chat-drafts', errorMessage: 'disk error' });

    await expect(getAll({ db, storeName: 'drafts' })).rejects.toThrow(
      /^getAll: failed to read drafts — disk error$/u,
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the storeName', async () => {
      const proxy = getAllProxy();
      const db = proxy.buildDb({ name: 'chat-drafts' });

      await getAll({ db, storeName: 'computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([['computed-at-runtime']]);
    });
  });
});
