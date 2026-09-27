import { sessionStorage } from './sessionStorage';

describe('#gateway/browser/sessionStorage', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(sessionStorage).toBe(globalThis.sessionStorage);
  });
});
