import { readItem } from './read-item';
import { readItemProxy } from './read-item.proxy';

describe('readItem', () => {
  it('VALID: {key holds a value} => returns the stored string', () => {
    globalThis.localStorage.setItem('read-item-valid', 'hello');

    expect(readItem({ key: 'read-item-valid' })).toBe('hello');
  });

  it('VALID: {key holds a value that is not valid JSON} => returns the raw string, does not parse', () => {
    globalThis.localStorage.setItem('read-item-not-json', 'not-json-at-all{');

    expect(readItem({ key: 'read-item-not-json' })).toBe('not-json-at-all{');
  });

  it('EMPTY: {key absent} => returns null', () => {
    expect(readItem({ key: 'read-item-missing-key' })).toBe(null);
  });

  it('ERROR: {storage disabled, getItem throws} => returns null rather than throwing', () => {
    const proxy = readItemProxy();
    proxy.setupReadFails({
      key: 'read-item-blocked',
      error: Object.assign(new Error('access denied'), { name: 'SecurityError' }),
    });

    expect(readItem({ key: 'read-item-blocked' })).toBe(null);
  });

  describe('tolerant addressing', () => {
    it('ERROR: {throwsMatchingKey, a predicate} => returns null for a key the predicate accepts', () => {
      const proxy = readItemProxy();
      proxy.throwsMatchingKey({
        key: (value) => String(value).startsWith('read-item-computed-'),
        error: Object.assign(new Error('access denied'), { name: 'SecurityError' }),
      });

      expect(readItem({ key: 'read-item-computed-at-runtime' })).toBe(null);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the key', () => {
      const proxy = readItemProxy();
      globalThis.localStorage.setItem('read-item-inspected', 'hello');

      readItem({ key: 'read-item-inspected' });

      expect(proxy.getCallsFor({ key: 'read-item-inspected' })).toStrictEqual([
        ['read-item-inspected'],
      ]);
    });
  });
});
