import { sessionStorage } from './index';

describe('@dungeonmaster/browser/sessionStorage', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(sessionStorage).toBe(globalThis.sessionStorage);
  });
});
