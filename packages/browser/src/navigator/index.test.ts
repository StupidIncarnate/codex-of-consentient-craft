import { navigator } from './index';

describe('@dungeonmaster/browser/navigator', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(navigator).toBe(globalThis.navigator);
  });
});
