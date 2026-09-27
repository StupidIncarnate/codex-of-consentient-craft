import { URL } from './URL';

describe('#gateway/browser/URL', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(URL).toBe(globalThis.URL);
  });
});
