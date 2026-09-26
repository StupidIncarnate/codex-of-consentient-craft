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
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'shared',
        packageJson: {
          name: '@dungeonmaster/shared',
          exports: { './testing': { source: './testing.ts' } },
        },
      });
      proxy.setupSourceFileExists({ filePath: '/repo/packages/shared/testing.ts' });
      const sourceFilePath = FilePathStub({ value: '/repo/src/widget/widget.test.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/shared/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(FilePathStub({ value: '/repo/packages/shared/testing.ts' }));
    });
  });

  describe('cross-package gateway testing subpaths', () => {
    it('VALID: {@dungeonmaster/bin/testing, src/testing/index.ts pattern export} => returns resolved index path', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'bin',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: {
            './testing': { source: './src/testing/index.ts' },
            './*': { source: './src/*/index.ts' },
          },
        },
      });
      proxy.setupSourceFileExists({ filePath: '/repo/packages/bin/src/testing/index.ts' });
      const sourceFilePath = FilePathStub({
        value:
          '/repo/packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.proxy.ts',
      });
      const importPath = ImportPathStub({ value: '@dungeonmaster/bin/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({ value: '/repo/packages/bin/src/testing/index.ts' }),
      );
    });

    it('VALID: {@dungeonmaster/node/testing, only a wildcard export} => resolves through the "./*" pattern', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'node',
        packageJson: {
          name: '@dungeonmaster/node',
          exports: { './*': { source: './src/*/index.ts' } },
        },
      });
      proxy.setupSourceFileExists({ filePath: '/repo/packages/node/src/testing/index.ts' });
      const sourceFilePath = FilePathStub({ value: '/repo/packages/hooks/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/node/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({ value: '/repo/packages/node/src/testing/index.ts' }),
      );
    });

    it('VALID: {matching package, resolved source file missing on disk} => returns null', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'bin',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: { './testing': { source: './src/testing/index.ts' } },
        },
      });
      const sourceFilePath = FilePathStub({ value: '/repo/packages/hooks/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/bin/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });

    it('VALID: {no sibling package has this name} => returns null', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'bin',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: { './testing': { source: './src/testing/index.ts' } },
        },
      });
      const sourceFilePath = FilePathStub({ value: '/repo/packages/hooks/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/npm/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });

    it('VALID: {package found, but no export matches the subpath} => returns null', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'bin',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: { './git': { source: './src/git/index.ts' } },
        },
      });
      const sourceFilePath = FilePathStub({ value: '/repo/packages/hooks/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/bin/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });

    it('VALID: {no ancestor package.json declares workspaces} => returns null', () => {
      importPathResolverMiddlewareProxy();
      const sourceFilePath = FilePathStub({ value: '/unreachable/deep/path/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/bin/testing' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });

  describe('imports-map "#" specifiers', () => {
    it("VALID: {#gateway/npm/_test_} => resolves through the importing package's own imports map", () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupImportingPackage({
        dirPath: '/repo/packages/mcp',
        packageJson: {
          name: '@dungeonmaster/mcp',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
        },
      });
      proxy.setupWorkspaceRoot({
        workspaceRootPath: '/repo',
        workspaces: ['packages/*', 'packages/@gateway/*'],
      });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'npm',
        packagesBaseDir: 'packages/@gateway',
        packageJson: {
          name: '@dungeonmaster/npm',
          exports: { './_test_': { source: './src/_test_/index.ts' } },
        },
      });
      proxy.setupSourceFileExists({ filePath: '/repo/packages/@gateway/npm/src/_test_/index.ts' });
      const sourceFilePath = FilePathStub({
        value: '/repo/packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts',
      });
      const importPath = ImportPathStub({ value: '#gateway/npm/_test_' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({ value: '/repo/packages/@gateway/npm/src/_test_/index.ts' }),
      );
    });

    it('INVALID: {#foo, unmapped specifier} => returns null', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupImportingPackage({
        dirPath: '/repo/packages/mcp',
        packageJson: {
          name: '@dungeonmaster/mcp',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
        },
      });
      const sourceFilePath = FilePathStub({ value: '/repo/packages/mcp/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '#foo' });

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
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
