import { getAll } from '../get-all/get-all';
import { put } from '../put/put';
import { replaceAll } from './replace-all';
import { replaceAllProxy } from './replace-all.proxy';

describe('replaceAll', () => {
  it('VALID: {replace keeps other scopes and appends fresh records} => the store holds exactly the returned list, in order', async () => {
    const proxy = replaceAllProxy();
    proxy.seedRecords({
      name: 'chat-drafts',
      storeName: 'drafts',
      records: [
        { scope: 'a', n: 1 },
        { scope: 'b', n: 2 },
        { scope: 'a', n: 3 },
      ],
    });
    const db = proxy.buildDb({ name: 'chat-drafts' });

    await replaceAll({
      db,
      storeName: 'drafts',
      replace: ({ existing }) => [
        ...existing.filter((record) => (record as { scope: string }).scope !== 'a'),
        { scope: 'a', n: 9 },
      ],
    });

    expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual([
      { scope: 'b', n: 2 },
      { scope: 'a', n: 9 },
    ]);
  });

  it('VALID: {replace returns []} => the store ends empty', async () => {
    const proxy = replaceAllProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['x', 'y'] });
    const db = proxy.buildDb({ name: 'chat-drafts' });

    await replaceAll({ db, storeName: 'drafts', replace: () => [] });

    expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual([]);
  });

  it('VALID: {a rewrite} => exactly one readwrite transaction issued getAll, clear, then the adds', async () => {
    const proxy = replaceAllProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['x'] });
    const db = proxy.buildDb({ name: 'chat-drafts' });

    await replaceAll({ db, storeName: 'drafts', replace: ({ existing }) => [...existing, 'z'] });

    expect(proxy.getTransactionsFor()).toStrictEqual([
      { storeNames: ['drafts'], mode: 'readwrite', ops: ['getAll', 'clear', 'add', 'add'] },
    ]);
  });

  it('EDGE: {put, replaceAll and getAll on databases from one proxy} => all three operate on one shared store', async () => {
    const proxy = replaceAllProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['seeded'] });

    await put({
      db: proxy.buildDb({ name: 'chat-drafts' }),
      storeName: 'drafts',
      value: 'put-after-seed',
    });
    await replaceAll({
      db: proxy.buildDb({ name: 'chat-drafts' }),
      storeName: 'drafts',
      replace: ({ existing }) => existing.map((record) => `replaced:${String(record)}`),
    });
    const finalRead = await getAll({
      db: proxy.buildDb({ name: 'chat-drafts' }),
      storeName: 'drafts',
    });

    expect(finalRead).toStrictEqual(['replaced:seeded', 'replaced:put-after-seed']);
  });

  it('ERROR: {the read fails} => rejects naming the store and the real error, records untouched', async () => {
    const proxy = replaceAllProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['x'] });
    const db = proxy.buildFailingDb({
      name: 'chat-drafts',
      errorMessage: 'disk error',
      failOn: 'read',
    });

    await expect(replaceAll({ db, storeName: 'drafts', replace: () => [] })).rejects.toThrow(
      /^replaceAll: failed to read drafts — disk error$/u,
    );
    expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual(['x']);
  });

  it('ERROR: {the rewrite fails} => rejects naming the store and the real error', async () => {
    const proxy = replaceAllProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['x'] });
    const db = proxy.buildFailingDb({
      name: 'chat-drafts',
      errorMessage: 'quota exceeded',
      failOn: 'write',
    });

    await expect(replaceAll({ db, storeName: 'drafts', replace: () => ['y'] })).rejects.toThrow(
      /^replaceAll: failed to rewrite drafts — quota exceeded$/u,
    );
  });

  it('ERROR: {replace throws} => rejects naming the store and the thrown message, records untouched', async () => {
    const proxy = replaceAllProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['x'] });
    const db = proxy.buildDb({ name: 'chat-drafts' });

    await expect(
      replaceAll({
        db,
        storeName: 'drafts',
        replace: () => {
          throw new Error('bad record');
        },
      }),
    ).rejects.toThrow(/^replaceAll: replace threw for drafts — Error: bad record$/u);
    expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual(['x']);
  });
});
