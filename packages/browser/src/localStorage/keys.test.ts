import { keys } from './keys';
import { keysProxy } from './keys.proxy';

describe('keys', () => {
  it('VALID: {storage holds entries} => returns every key', () => {
    globalThis.localStorage.clear();
    globalThis.localStorage.setItem('keys-first', 'a');
    globalThis.localStorage.setItem('keys-second', 'b');

    expect(keys()).toStrictEqual(['keys-first', 'keys-second']);
  });

  it('EMPTY: {storage empty} => returns []', () => {
    globalThis.localStorage.clear();

    expect(keys()).toStrictEqual([]);
  });

  it('ERROR: {storage disabled, key() throws} => returns [] rather than throwing', () => {
    globalThis.localStorage.clear();
    globalThis.localStorage.setItem('keys-blocked', 'a');
    const proxy = keysProxy();
    proxy.setupEnumerationFails({
      error: Object.assign(new Error('access denied'), { name: 'SecurityError' }),
    });

    expect(keys()).toStrictEqual([]);
  });
});
