import { AbortController } from './AbortController';

describe('#gateway/browser/AbortController', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(AbortController).toBe(globalThis.AbortController);
  });
});
