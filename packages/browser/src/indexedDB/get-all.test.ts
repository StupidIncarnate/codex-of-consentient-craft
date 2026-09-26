import { getAll } from './get-all';
import { getAllProxy } from './get-all.proxy';

describe('getAll', () => {
  it('VALID: {store holds records} => resolves them in getAll order', async () => {
    const proxy = getAllProxy();
    const db = proxy.buildDb({ records: ['first', 'second'] });

    const result = await getAll({ db, storeName: 'drafts' });

    expect(result).toStrictEqual(['first', 'second']);
  });

  it('EMPTY: {store empty} => resolves []', async () => {
    const proxy = getAllProxy();
    const db = proxy.buildDb({ records: [] });

    const result = await getAll({ db, storeName: 'drafts' });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: {read transaction fails} => rejects naming the store and the real error', async () => {
    const proxy = getAllProxy();
    const db = proxy.buildFailingDb({ errorMessage: 'disk error' });

    await expect(getAll({ db, storeName: 'drafts' })).rejects.toThrow(
      /getAll: failed to read drafts — disk error/u,
    );
  });
});
