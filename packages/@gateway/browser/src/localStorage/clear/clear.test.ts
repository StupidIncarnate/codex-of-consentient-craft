import { readItem } from '../read-item/read-item';
import { clear } from './clear';
import { clearProxy } from './clear.proxy';
import { StorageDisabledErrorStub } from '../read-item/storage-disabled-error.stub';

describe('clear', () => {
  it('VALID: {two keys stored} => removes both and returns { success: true }', () => {
    globalThis.localStorage.setItem('clear-first', 'one');
    globalThis.localStorage.setItem('clear-second', 'two');

    const result = clear();

    expect({
      result,
      first: readItem({ key: 'clear-first' }),
      second: readItem({ key: 'clear-second' }),
    }).toStrictEqual({ result: { success: true }, first: null, second: null });
  });

  it('EMPTY: {storage already empty} => returns { success: true }', () => {
    globalThis.localStorage.clear();

    expect(clear()).toStrictEqual({ success: true });
  });

  it('ERROR: {storage disabled, clear throws} => returns { success: false, error } carrying the real error rather than throwing', () => {
    const proxy = clearProxy();
    const securityError = StorageDisabledErrorStub();
    proxy.setupClearFails({ error: securityError });

    const result = clear();

    expect(result).toStrictEqual({ success: false, error: securityError });
  });

  describe('call inspection', () => {
    it('VALID: {one real call} => getCalls reads back one argument-less call', () => {
      const proxy = clearProxy();

      clear();

      expect(proxy.getCalls()).toStrictEqual([[]]);
    });
  });
});
