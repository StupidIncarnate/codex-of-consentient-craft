import { put } from './put';
import { putProxy } from './put.proxy';

describe('put', () => {
  it('VALID: {value} => resolves the key the record was stored under', async () => {
    const proxy = putProxy();
    const db = proxy.buildDb({ key: 7 });

    const result = await put({ db, storeName: 'drafts', value: { text: 'draft' } });

    expect(result).toBe(7);
  });

  it('ERROR: {write transaction fails} => rejects naming the store and the real error', async () => {
    const proxy = putProxy();
    const db = proxy.buildFailingDb({ errorMessage: 'quota exceeded' });

    await expect(put({ db, storeName: 'drafts', value: {} })).rejects.toThrow(
      /put: failed to write to drafts — quota exceeded/u,
    );
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the storeName and value', async () => {
      const proxy = putProxy();
      const db = proxy.buildDb({ key: 7 });

      await put({ db, storeName: 'drafts', value: { text: 'computed-at-runtime' } });

      expect(proxy.getCallsFor()).toStrictEqual([['drafts', { text: 'computed-at-runtime' }]]);
    });
  });
});
