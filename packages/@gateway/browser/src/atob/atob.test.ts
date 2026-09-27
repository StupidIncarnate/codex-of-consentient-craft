import { atob } from './atob';

describe('#gateway/browser/atob', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(atob).toBe(globalThis.atob);
  });
});
