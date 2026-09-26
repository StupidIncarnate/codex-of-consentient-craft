import { window } from './index';

describe('@dungeonmaster/browser/window', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(window).toBe(globalThis.window);
  });
});
