import { FileReader } from './FileReader';

describe('#gateway/browser/FileReader', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(FileReader).toBe(globalThis.FileReader);
  });
});
