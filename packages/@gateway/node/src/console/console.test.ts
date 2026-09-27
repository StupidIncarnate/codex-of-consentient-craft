import { console } from './console';

describe('#gateway/node/console', () => {
  it('VALID: {export} => is the same object Node provides on globalThis', () => {
    expect(console).toBe(globalThis.console);
  });
});
