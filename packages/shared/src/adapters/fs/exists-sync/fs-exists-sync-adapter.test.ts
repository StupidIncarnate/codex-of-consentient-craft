import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsExistsSyncAdapter', () => {
  describe('file exists', () => {
    it('VALID: {filePath: existing file} => returns true', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/file.ts' });

      proxy.returns({ filePath, result: true });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(true);
    });
  });

  describe('file does not exist', () => {
    it('VALID: {filePath: non-existing file} => returns false', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/missing.ts' });

      proxy.returns({ filePath, result: false });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(false);
    });
  });
});
