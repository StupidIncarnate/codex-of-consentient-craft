import { readItem } from './read-item';
import { removeItem } from './remove-item';
import { removeItemProxy } from './remove-item.proxy';

describe('removeItem', () => {
  it('VALID: {key holds a value} => removes it and returns { success: true }', () => {
    globalThis.localStorage.setItem('remove-item-valid', 'value');

    const result = removeItem({ key: 'remove-item-valid' });

    expect(result).toStrictEqual({ success: true });
    expect(readItem({ key: 'remove-item-valid' })).toBe(null);
  });

  it('ERROR: {storage disabled, removeItem throws} => returns { success: false, error } carrying the real error rather than throwing', () => {
    const proxy = removeItemProxy();
    const securityError = Object.assign(new Error('access denied'), { name: 'SecurityError' });
    proxy.setupRemoveFails({ key: 'remove-item-blocked', error: securityError });

    const result = removeItem({ key: 'remove-item-blocked' });

    expect(result).toStrictEqual({ success: false, error: securityError });
  });
});
