import { put } from './put';
import { putProxy } from './put.proxy';

describe('put', () => {
  it('VALID: {value} => resolves the generated key and the store holds the record', async () => {
    const proxy = putProxy();
    proxy.seedRecords({ name: 'chat-drafts', storeName: 'drafts', records: ['existing'] });
    const db = proxy.buildDb({ name: 'chat-drafts' });

    const result = await put({ db, storeName: 'drafts', value: { text: 'draft' } });

    expect(result).toBe(2);
    expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual([
      'existing',
      { text: 'draft' },
    ]);
  });

  it('ERROR: {write transaction fails} => rejects naming the store and the real error, store untouched', async () => {
    const proxy = putProxy();
    const db = proxy.buildFailingDb({ name: 'chat-drafts', errorMessage: 'quota exceeded' });

    await expect(put({ db, storeName: 'drafts', value: {} })).rejects.toThrow(
      /^put: failed to write to drafts — quota exceeded$/u,
    );
    expect(proxy.getRecords({ name: 'chat-drafts', storeName: 'drafts' })).toStrictEqual([]);
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the storeName and value', async () => {
      const proxy = putProxy();
      const db = proxy.buildDb({ name: 'chat-drafts' });

      await put({ db, storeName: 'drafts', value: { text: 'computed-at-runtime' } });

      expect(proxy.getCallsFor()).toStrictEqual([['drafts', { text: 'computed-at-runtime' }]]);
    });
  });
});
