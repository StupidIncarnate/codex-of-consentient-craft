import { keys } from './keys';
import { keysProxy } from './keys.proxy';
import { StorageDisabledErrorStub } from '../read-item/storage-disabled-error.stub';

describe('keys', () => {
  it('VALID: {storage holds entries} => returns { success: true, keys } with every key', () => {
    globalThis.localStorage.clear();
    globalThis.localStorage.setItem('keys-first', 'a');
    globalThis.localStorage.setItem('keys-second', 'b');

    expect(keys()).toStrictEqual({ success: true, keys: ['keys-first', 'keys-second'] });
  });

  it('EMPTY: {storage empty} => returns { success: true, keys: [] }', () => {
    globalThis.localStorage.clear();

    expect(keys()).toStrictEqual({ success: true, keys: [] });
  });

  it('ERROR: {storage disabled, key() throws} => returns { success: false, error } carrying the real error rather than throwing', () => {
    globalThis.localStorage.clear();
    globalThis.localStorage.setItem('keys-blocked', 'a');
    const proxy = keysProxy();
    const securityError = StorageDisabledErrorStub();
    proxy.setupEnumerationFails({ error: securityError });

    expect(keys()).toStrictEqual({ success: false, error: securityError });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the enumerated index', () => {
      globalThis.localStorage.clear();
      globalThis.localStorage.setItem('keys-first', 'a');
      const proxy = keysProxy();

      keys();

      expect(proxy.getCallsFor()).toStrictEqual([[0]]);
    });
  });
});
