import { navigator } from './navigator';

describe('#gateway/browser/navigator', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(navigator).toBe(globalThis.navigator);
  });
});
