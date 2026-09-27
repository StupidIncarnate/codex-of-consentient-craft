import { console } from './console';

describe('#gateway/browser/console', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(console).toBe(globalThis.console);
  });
});
