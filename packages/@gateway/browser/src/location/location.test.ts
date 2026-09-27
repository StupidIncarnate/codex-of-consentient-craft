import { location } from './location';

describe('#gateway/browser/location', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(location).toBe(globalThis.location);
  });
});
