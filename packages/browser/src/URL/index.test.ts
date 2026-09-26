import { URL } from './index';

describe('@dungeonmaster/browser/URL', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(URL).toBe(globalThis.URL);
  });
});
