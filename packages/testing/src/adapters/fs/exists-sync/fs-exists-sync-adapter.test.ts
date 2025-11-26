import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsExistsSyncAdapter', () => {
  describe('file exists', () => {
    it('VALID: {filePath: existing file} => returns true', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/tmp/test.ts' });

      proxy.returnsTrue({ filePath });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(true);
    });

    it('VALID: {filePath: different existing file} => returns true', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/file.proxy.ts' });

      proxy.returnsTrue({ filePath });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(true);
    });
  });

  describe('file does not exist', () => {
    it('INVALID: {filePath: nonexistent file} => returns false', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent/file.ts' });

      proxy.returnsFalse({ filePath });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(false);
    });

    it('INVALID: {filePath: different nonexistent file} => returns false', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/another/missing.ts' });

      proxy.returnsFalse({ filePath });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(false);
    });
  });
});
