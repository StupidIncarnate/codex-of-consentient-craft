import { window } from './window';

describe('#gateway/browser/window', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(window).toBe(globalThis.window);
  });
});
