import { atob } from './index';

describe('@dungeonmaster/browser/atob', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(atob).toBe(globalThis.atob);
  });
});
