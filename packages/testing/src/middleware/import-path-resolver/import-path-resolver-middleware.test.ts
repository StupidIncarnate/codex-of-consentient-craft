import { importPathResolverMiddleware } from './import-path-resolver-middleware';
import { importPathResolverMiddlewareProxy } from './import-path-resolver-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';

describe('importPathResolverMiddleware', () => {
  describe('relative imports', () => {
    it('VALID: {relative import to an existing .ts proxy file} => returns FilePath', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: ['/repo/src/widget/widget.proxy.ts'] });
      const sourceFilePath = FilePathStub({ value: '/repo/src/widget/widget.test.ts' });
      const importPath = ImportPathStub({ value: './widget.proxy' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(FilePathStub({ value: '/repo/src/widget/widget.proxy.ts' }));
    });

    it('VALID: {relative import that already carries its .ts extension} => returns FilePath as-is', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: ['/repo/src/widget/widget.ts'] });
      const sourceFilePath = FilePathStub({ value: '/repo/src/widget/widget.test.ts' });
      const importPath = ImportPathStub({ value: './widget.ts' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(FilePathStub({ value: '/repo/src/widget/widget.ts' }));
    });
  });

  describe('non-relative imports', () => {
    it('VALID: {absolute import path} => returns null', () => {
      importPathResolverMiddlewareProxy();
      const sourceFilePath = FilePathStub({ value: '/src/test.test.ts' });
      const importPath = ImportPathStub({ value: 'some-package' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });

  describe('package barrel imports', () => {
    it('VALID: {@dungeonmaster/shared/testing} => returns testing.ts barrel path', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDiskMatching({ pattern: /\/packages\/shared\/testing\.ts$/u });
      const sourceFilePath = FilePathStub({ value: '/repo/src/widget/widget.test.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/shared/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(String(result)).toMatch(/^\/.*\/packages\/shared\/testing\.ts$/u);
    });
  });

  describe('tsx extension', () => {
    it('VALID: {relative import to a .tsx proxy file} => returns FilePath with .tsx', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: ['/repo/src/widgets/btn/btn-widget.proxy.tsx'] });
      const sourceFilePath = FilePathStub({ value: '/repo/src/widgets/btn/btn-widget.test.tsx' });
      const importPath = ImportPathStub({ value: './btn-widget.proxy' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({ value: '/repo/src/widgets/btn/btn-widget.proxy.tsx' }),
      );
    });
  });

  describe('jsx extension', () => {
    it('VALID: {relative import to a .jsx file} => returns FilePath with .jsx', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: ['/repo/src/widget/legacy.jsx'] });
      const sourceFilePath = FilePathStub({ value: '/repo/src/widget/widget.test.ts' });
      const importPath = ImportPathStub({ value: './legacy' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(FilePathStub({ value: '/repo/src/widget/legacy.jsx' }));
    });
  });

  describe('file not found', () => {
    it('VALID: {no candidate file exists} => returns null', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: [] });
      const sourceFilePath = FilePathStub({ value: '/repo/src/widget/widget.test.ts' });
      const importPath = ImportPathStub({ value: './missing.proxy' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });
});
