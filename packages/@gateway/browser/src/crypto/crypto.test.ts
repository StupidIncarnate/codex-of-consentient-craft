import { crypto } from './crypto';

describe('#gateway/browser/crypto', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(crypto).toBe(globalThis.crypto);
  });
});
