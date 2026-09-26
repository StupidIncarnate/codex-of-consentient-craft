import { packageSpecifierSplitTransformer } from './package-specifier-split-transformer';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';

describe('packageSpecifierSplitTransformer', () => {
  describe('scoped package specifiers', () => {
    it('VALID: {importPath: "@dungeonmaster/bin/testing"} => splits into package name and subpath', () => {
      const importPath = ImportPathStub({ value: '@dungeonmaster/bin/testing' });

      const result = packageSpecifierSplitTransformer({ importPath });

      expect(result).toStrictEqual({ packageName: '@dungeonmaster/bin', subpath: 'testing' });
    });

    it('VALID: {importPath: "@dungeonmaster/npm/@playwright/test"} => keeps slashes in the subpath', () => {
      const importPath = ImportPathStub({ value: '@dungeonmaster/npm/@playwright/test' });

      const result = packageSpecifierSplitTransformer({ importPath });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/npm',
        subpath: '@playwright/test',
      });
    });
  });

  describe('unscoped package specifiers', () => {
    it('VALID: {importPath: "some-package/testing"} => splits into package name and subpath', () => {
      const importPath = ImportPathStub({ value: 'some-package/testing' });

      const result = packageSpecifierSplitTransformer({ importPath });

      expect(result).toStrictEqual({ packageName: 'some-package', subpath: 'testing' });
    });
  });

  describe('no subpath', () => {
    it('INVALID: {importPath: "some-package"} => returns null', () => {
      const importPath = ImportPathStub({ value: 'some-package' });

      const result = packageSpecifierSplitTransformer({ importPath });

      expect(result).toBe(null);
    });

    it('INVALID: {importPath: "axios"} => returns null', () => {
      const importPath = ImportPathStub({ value: 'axios' });

      const result = packageSpecifierSplitTransformer({ importPath });

      expect(result).toBe(null);
    });
  });
});
