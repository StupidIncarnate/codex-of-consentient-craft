import { console } from './index';

describe('@dungeonmaster/browser/console', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(console).toBe(globalThis.console);
  });
});
