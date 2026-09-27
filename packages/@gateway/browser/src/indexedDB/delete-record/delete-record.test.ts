import { deleteRecord } from './delete-record';
import { deleteRecordProxy } from './delete-record.proxy';

describe('deleteRecord', () => {
  it('VALID: {key} => resolves once the record is removed', async () => {
    const proxy = deleteRecordProxy();
    const db = proxy.buildDb();

    await expect(deleteRecord({ db, storeName: 'drafts', key: 1 })).resolves.toBe(undefined);
  });

  it('ERROR: {write transaction fails} => rejects naming the store and the real error', async () => {
    const proxy = deleteRecordProxy();
    const db = proxy.buildFailingDb({ errorMessage: 'another tab holds an exclusive lock' });

    await expect(deleteRecord({ db, storeName: 'drafts', key: 1 })).rejects.toThrow(
      /deleteRecord: failed to delete from drafts — another tab holds an exclusive lock/u,
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the storeName and key', async () => {
      const proxy = deleteRecordProxy();
      const db = proxy.buildDb();

      await deleteRecord({ db, storeName: 'drafts', key: 'computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([['drafts', 'computed-at-runtime']]);
    });
  });
});
