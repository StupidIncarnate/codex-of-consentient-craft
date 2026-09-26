import { fsExistsSyncAdapter } from './fs-exists-sync-adapter';
import { fsExistsSyncAdapterProxy } from './fs-exists-sync-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsExistsSyncAdapter', () => {
  describe('file exists', () => {
    it('VALID: {filePath: existing file} => returns true', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/repo/src/present.ts' });
      proxy.returns({ filePath, exists: true });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(true);
    });
  });

  describe('file does not exist', () => {
    it('INVALID: {filePath: nonexistent file} => returns false', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent/file/that/does/not/exist.ts' });
      proxy.returns({ filePath, exists: false });

      const result = fsExistsSyncAdapter({ filePath });

      expect(result).toBe(false);
    });
  });

  describe('addressed by path', () => {
    it('VALID: {two paths staged differently} => each path gets its own answer', () => {
      const proxy = fsExistsSyncAdapterProxy();
      const present = FilePathStub({ value: '/repo/a.ts' });
      const absent = FilePathStub({ value: '/repo/b.ts' });
      proxy.returns({ filePath: present, exists: true });
      proxy.returns({ filePath: absent, exists: false });

      const results = [
        fsExistsSyncAdapter({ filePath: present }),
        fsExistsSyncAdapter({ filePath: absent }),
      ];

      expect(results).toStrictEqual([true, false]);
    });
  });
});
