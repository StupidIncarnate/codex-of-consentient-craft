import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsExistsSyncAdapter', () => {
  describe('file exists', () => {
    it('VALID: {filePath: existing file} => returns true', () => {
      const proxy = fsExistsSyncAdapterProxy();

      proxy.returns({ result: true });

      const result = fsExistsSyncAdapter({
        filePath: FilePathStub({ value: '/path/to/file.ts' }),
      });

      expect(result).toBe(true);
    });
  });

  describe('file does not exist', () => {
    it('VALID: {filePath: non-existing file} => returns false', () => {
      const proxy = fsExistsSyncAdapterProxy();

      proxy.returns({ result: false });

      const result = fsExistsSyncAdapter({
        filePath: FilePathStub({ value: '/path/to/missing.ts' }),
      });

      expect(result).toBe(false);
    });
  });
});
