import { btoa } from './btoa';

describe('#gateway/browser/btoa', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(btoa).toBe(globalThis.btoa);
  });

  it('VALID: {binary string} => encodes it to base64', () => {
    expect(btoa('hello')).toBe('aGVsbG8=');
  });
});
