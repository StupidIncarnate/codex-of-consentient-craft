import { fsExistsAdapter } from './fs-exists-adapter';
import { fsExistsAdapterProxy } from './fs-exists-adapter.proxy';

describe('fsExistsAdapter', () => {
  describe('file exists', () => {
    it('VALID: {filePath: "/tmp/test.txt"} => returns true', () => {
      const proxy = fsExistsAdapterProxy();
      const filePath = '/tmp/test.txt';

      proxy.returns({ filePath, exists: true });

      const result = fsExistsAdapter({ filePath });

      expect(result).toBe(true);
    });
  });

  describe('file does not exist', () => {
    it('VALID: {filePath: "/nonexistent.txt"} => returns false', () => {
      const proxy = fsExistsAdapterProxy();
      const filePath = '/nonexistent.txt';

      proxy.returns({ filePath, exists: false });

      const result = fsExistsAdapter({ filePath });

      expect(result).toBe(false);
    });
  });
});
