import { Blob } from './Blob';

describe('#gateway/browser/Blob', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(Blob).toBe(globalThis.Blob);
  });
});
