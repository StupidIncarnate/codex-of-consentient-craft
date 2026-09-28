import { deleteRecord } from './delete-record';
import { deleteRecordProxy } from './delete-record.proxy';

describe('deleteRecord', () => {
  it('VALID: {key of a seeded record} => resolves and the store no longer holds that record', async () => {
    const proxy = deleteRecordProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['first', 'second'] });
    const db = proxy.buildDb({ name: 'chat-drafts' });

    await expect(deleteRecord({ db, storeName: 'drafts', key: 1 })).resolves.toBe(undefined);

    expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual([
      'second',
    ]);
  });

  it('ERROR: {write transaction fails} => rejects naming the store and the real error, store untouched', async () => {
    const proxy = deleteRecordProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['first'] });
    const db = proxy.buildFailingDb({
      name: 'chat-drafts',
      errorMessage: 'another tab holds an exclusive lock',
    });

    await expect(deleteRecord({ db, storeName: 'drafts', key: 1 })).rejects.toThrow(
      /^deleteRecord: failed to delete from drafts — another tab holds an exclusive lock$/u,
    );
    expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual(['first']);
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the storeName and key', async () => {
      const proxy = deleteRecordProxy();
      const db = proxy.buildDb({ name: 'chat-drafts' });

      await deleteRecord({ db, storeName: 'drafts', key: 'computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([['drafts', 'computed-at-runtime']]);
    });
  });
});
