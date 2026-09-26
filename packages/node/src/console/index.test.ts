import { console } from './index';

describe('@dungeonmaster/node/console', () => {
  it('VALID: {export} => is the same object Node provides on globalThis', () => {
    expect(console).toBe(globalThis.console);
  });
});
