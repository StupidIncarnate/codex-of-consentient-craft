import { importPathResolverMiddleware } from './import-path-resolver-middleware';
import { importPathResolverMiddlewareProxy } from './import-path-resolver-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';

describe('importPathResolverMiddleware', () => {
  describe('relative imports', () => {
    it('VALID: {relative import to existing proxy file} => returns FilePath', () => {
      importPathResolverMiddlewareProxy();

      // Use the actual proxy file that exists alongside this test
      const sourceFilePath = FilePathStub({ value: __filename });
      const importPath = ImportPathStub({ value: './import-path-resolver-middleware.proxy' });
      const expectedPath = FilePathStub({
        value: `${__dirname}/import-path-resolver-middleware.proxy.ts`,
      });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(expectedPath);
    });

    it('VALID: {relative import with .ts extension exists} => returns FilePath', () => {
      importPathResolverMiddlewareProxy();

      // Use the actual middleware file
      const sourceFilePath = FilePathStub({ value: __filename });
      const importPath = ImportPathStub({ value: './import-path-resolver-middleware.ts' });
      const expectedPath = FilePathStub({
        value: `${__dirname}/import-path-resolver-middleware.ts`,
      });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(expectedPath);
    });
  });

  describe('non-relative imports', () => {
    it('VALID: {absolute import path} => returns null', () => {
      importPathResolverMiddlewareProxy();
      const sourceFilePath = FilePathStub({ value: '/src/test.test.ts' });
      const importPath = ImportPathStub({ value: 'some-package' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBeNull();
    });
  });

  describe('package barrel imports', () => {
    it('VALID: {@dungeonmaster/shared/testing} => returns testing.ts barrel path', () => {
      importPathResolverMiddlewareProxy();
      const sourceFilePath = FilePathStub({ value: __filename });
      const importPath = ImportPathStub({ value: '@dungeonmaster/shared/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).not.toBeNull();
      expect(String(result)).toMatch(/packages\/shared\/testing\.ts$/u);
    });
  });

  describe('file not found', () => {
    it('VALID: {file does not exist} => returns null', () => {
      importPathResolverMiddlewareProxy();
      const sourceFilePath = FilePathStub({ value: __filename });
      const importPath = ImportPathStub({ value: './nonexistent-file-that-does-not-exist.proxy' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBeNull();
    });
  });
});
