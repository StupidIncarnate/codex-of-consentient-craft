import { crypto, randomUuid } from './crypto';

describe('#gateway/browser/crypto', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(crypto).toBe(globalThis.crypto);
  });

  it('VALID: {randomUuid} => the barrel re-exports the wrapper as a function', () => {
    expect(randomUuid).toStrictEqual(expect.any(Function));
  });
});
