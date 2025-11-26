import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsExistsSyncAdapter', () => {
  describe('file exists', () => {
    it('VALID: {filePath: existing file} => returns true', () => {
      fsExistsSyncAdapterProxy();
      // Use a file that actually exists
      const filePath = FilePathStub({ value: __filename });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(true);
    });

    it('VALID: {filePath: different existing file} => returns true', () => {
      fsExistsSyncAdapterProxy();
      // Use the adapter file which exists
      const filePath = FilePathStub({ value: `${__dirname}/fs-exists-sync-adapter.ts` });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(true);
    });
  });

  describe('file does not exist', () => {
    it('INVALID: {filePath: nonexistent file} => returns false', () => {
      fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent/file/that/does/not/exist.ts' });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(false);
    });

    it('INVALID: {filePath: different nonexistent file} => returns false', () => {
      fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/another/missing/path/nowhere.ts' });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(false);
    });
  });
});
