import { File } from './File';

describe('#gateway/browser/File', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(File).toBe(globalThis.File);
  });
});
