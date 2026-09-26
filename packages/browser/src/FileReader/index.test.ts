import { FileReader } from './index';

describe('@dungeonmaster/browser/FileReader', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(FileReader).toBe(globalThis.FileReader);
  });
});
