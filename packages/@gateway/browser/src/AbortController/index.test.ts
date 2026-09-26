import { AbortController } from './index';

describe('@dungeonmaster/browser/AbortController', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(AbortController).toBe(globalThis.AbortController);
  });
});
