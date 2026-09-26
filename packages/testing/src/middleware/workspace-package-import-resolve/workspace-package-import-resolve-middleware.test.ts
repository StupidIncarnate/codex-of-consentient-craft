import { workspacePackageImportResolveMiddleware } from './workspace-package-import-resolve-middleware';
import { workspacePackageImportResolveMiddlewareProxy } from './workspace-package-import-resolve-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';

describe('workspacePackageImportResolveMiddleware', () => {
  describe('cross-package testing subpath, literal export key', () => {
    it('VALID: {@dungeonmaster/shared/testing} => returns the barrel source path', () => {
      const proxy = workspacePackageImportResolveMiddlewareProxy();
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
      const sourceFilePath = FilePathStub({ value: '/repo/packages/hooks/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/shared/testing' });

      const result = workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(FilePathStub({ value: '/repo/packages/shared/testing.ts' }));
    });
  });

  describe('cross-package testing subpath, wildcard export key', () => {
    it('VALID: {@dungeonmaster/bin/testing, "./*" -> "./src/*/index.ts"} => returns the resolved index path', () => {
      const proxy = workspacePackageImportResolveMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'bin',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: { './*': { source: './src/*/index.ts' } },
        },
      });
      proxy.setupSourceFileExists({ filePath: '/repo/packages/bin/src/testing/index.ts' });
      const sourceFilePath = FilePathStub({
        value:
          '/repo/packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.proxy.ts',
      });
      const importPath = ImportPathStub({ value: '@dungeonmaster/bin/testing' });

      const result = workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({ value: '/repo/packages/bin/src/testing/index.ts' }),
      );
    });

    it('VALID: {two sibling packages registered, second one matches} => scans past the first', () => {
      const proxy = workspacePackageImportResolveMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'bin',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: { './*': { source: './src/*/index.ts' } },
        },
      });
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

      const result = workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({ value: '/repo/packages/node/src/testing/index.ts' }),
      );
    });
  });

  describe('no match', () => {
    it('INVALID: {importPath has no subpath} => returns null', () => {
      workspacePackageImportResolveMiddlewareProxy();
      const sourceFilePath = FilePathStub({ value: '/repo/packages/hooks/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: 'some-package' });

      const result = workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });

    it('INVALID: {no ancestor package.json declares workspaces} => returns null', () => {
      workspacePackageImportResolveMiddlewareProxy();
      const sourceFilePath = FilePathStub({ value: '/unreachable/deep/path/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '@dungeonmaster/bin/testing' });

      const result = workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });

    it('INVALID: {no sibling package has this name} => returns null', () => {
      const proxy = workspacePackageImportResolveMiddlewareProxy();
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

      const result = workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });

    it('INVALID: {package found, but no export matches the subpath} => returns null', () => {
      const proxy = workspacePackageImportResolveMiddlewareProxy();
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

      const result = workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });

    it('EMPTY: {matching package and export, but resolved source file missing on disk} => returns null', () => {
      const proxy = workspacePackageImportResolveMiddlewareProxy();
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

      const result = workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });
});
