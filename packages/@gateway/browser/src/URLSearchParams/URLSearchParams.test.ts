import { URLSearchParams } from './URLSearchParams';

describe('#gateway/browser/URLSearchParams', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(URLSearchParams).toBe(globalThis.URLSearchParams);
  });
});
