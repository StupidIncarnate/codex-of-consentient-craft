import { readItem } from '../read-item/read-item';
import { removeItem } from './remove-item';
import { removeItemProxy } from './remove-item.proxy';
import { StorageDisabledErrorStub } from '../read-item/storage-disabled-error.stub';

describe('removeItem', () => {
  it('VALID: {key holds a value} => removes it and returns { success: true }', () => {
    globalThis.localStorage.setItem('remove-item-valid', 'value');

    const result = removeItem({ key: 'remove-item-valid' });

    expect(result).toStrictEqual({ success: true });
    expect(readItem({ key: 'remove-item-valid' })).toBe(null);
  });

  it('ERROR: {storage disabled, removeItem throws} => returns { success: false, error } carrying the real error rather than throwing', () => {
    const proxy = removeItemProxy();
    const securityError = StorageDisabledErrorStub();
    proxy.setupRemoveFails({ key: 'remove-item-blocked', error: securityError });

    const result = removeItem({ key: 'remove-item-blocked' });

    expect(result).toStrictEqual({ success: false, error: securityError });
  });

  describe('tolerant addressing', () => {
    it('ERROR: {throwsMatchingKey, a predicate} => returns { success: false, error } for a key the predicate accepts', () => {
      const proxy = removeItemProxy();
      const securityError = StorageDisabledErrorStub();
      proxy.throwsMatchingKey({
        key: (value) => String(value).startsWith('remove-item-computed-'),
        error: securityError,
      });

      const result = removeItem({ key: 'remove-item-computed-at-runtime' });

      expect(result).toStrictEqual({ success: false, error: securityError });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the key', () => {
      const proxy = removeItemProxy();
      globalThis.localStorage.setItem('remove-item-inspected', 'value');

      removeItem({ key: 'remove-item-inspected' });

      expect(proxy.getCallsFor({ key: 'remove-item-inspected' })).toStrictEqual([
        ['remove-item-inspected'],
      ]);
    });
  });
});
