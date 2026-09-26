import { location } from './index';

describe('@dungeonmaster/browser/location', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(location).toBe(globalThis.location);
  });
});
