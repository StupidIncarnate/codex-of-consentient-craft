import { Blob } from './index';

describe('@dungeonmaster/browser/Blob', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(Blob).toBe(globalThis.Blob);
  });
});
