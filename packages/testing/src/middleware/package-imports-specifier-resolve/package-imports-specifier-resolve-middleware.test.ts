import { packageImportsSpecifierResolveMiddleware } from './package-imports-specifier-resolve-middleware';
import { packageImportsSpecifierResolveMiddlewareProxy } from './package-imports-specifier-resolve-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';

describe('packageImportsSpecifierResolveMiddleware', () => {
  describe('mapped gateway specifier', () => {
    it("VALID: {#gateway/npm/glob/glob/glob.proxy} => resolves through the importing package's own imports map", () => {
      const proxy = packageImportsSpecifierResolveMiddlewareProxy();
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
          exports: { './*.proxy': { source: './src/*.proxy.ts' } },
        },
      });
      proxy.setupSourceFileExists({
        filePath: '/repo/packages/@gateway/npm/src/glob/glob/glob.proxy.ts',
      });
      const sourceFilePath = FilePathStub({
        value: '/repo/packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts',
      });
      const importPath = ImportPathStub({ value: '#gateway/npm/glob/glob/glob.proxy' });

      const result = packageImportsSpecifierResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({ value: '/repo/packages/@gateway/npm/src/glob/glob/glob.proxy.ts' }),
      );
    });
  });

  describe('gateway three-key exports form, order independent', () => {
    it('VALID: {#gateway/node/fs__promises/.../read-file-if-exists.proxy, keys in proxy/stub/barrel order} => resolves through the ".proxy" key', () => {
      const proxy = packageImportsSpecifierResolveMiddlewareProxy();
      proxy.setupImportingPackage({
        dirPath: '/repo/packages/mcp',
        packageJson: {
          name: '@dungeonmaster/mcp',
          imports: { '#gateway/node/*': '@dungeonmaster/node/*' },
        },
      });
      proxy.setupWorkspaceRoot({
        workspaceRootPath: '/repo',
        workspaces: ['packages/*', 'packages/@gateway/*'],
      });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'node',
        packagesBaseDir: 'packages/@gateway',
        packageJson: {
          name: '@dungeonmaster/node',
          exports: {
            './*.proxy': { source: './src/*.proxy.ts' },
            './*.stub': { source: './src/*.stub.ts' },
            './*': { source: './src/*/*.ts' },
          },
        },
      });
      proxy.setupSourceFileExists({
        filePath:
          '/repo/packages/@gateway/node/src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts',
      });
      const sourceFilePath = FilePathStub({
        value: '/repo/packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts',
      });
      const importPath = ImportPathStub({
        value: '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy',
      });

      const result = packageImportsSpecifierResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({
          value:
            '/repo/packages/@gateway/node/src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts',
        }),
      );
    });

    it('VALID: {same import, keys in barrel/stub/proxy order} => still resolves through the ".proxy" key', () => {
      const proxy = packageImportsSpecifierResolveMiddlewareProxy();
      proxy.setupImportingPackage({
        dirPath: '/repo/packages/mcp',
        packageJson: {
          name: '@dungeonmaster/mcp',
          imports: { '#gateway/node/*': '@dungeonmaster/node/*' },
        },
      });
      proxy.setupWorkspaceRoot({
        workspaceRootPath: '/repo',
        workspaces: ['packages/*', 'packages/@gateway/*'],
      });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'node',
        packagesBaseDir: 'packages/@gateway',
        packageJson: {
          name: '@dungeonmaster/node',
          exports: {
            './*': { source: './src/*/*.ts' },
            './*.stub': { source: './src/*.stub.ts' },
            './*.proxy': { source: './src/*.proxy.ts' },
          },
        },
      });
      proxy.setupSourceFileExists({
        filePath:
          '/repo/packages/@gateway/node/src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts',
      });
      const sourceFilePath = FilePathStub({
        value: '/repo/packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts',
      });
      const importPath = ImportPathStub({
        value: '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy',
      });

      const result = packageImportsSpecifierResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        FilePathStub({
          value:
            '/repo/packages/@gateway/node/src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts',
        }),
      );
    });
  });

  describe('unmapped specifier', () => {
    it('INVALID: {#foo, importing package has an imports map but no matching key} => returns null', () => {
      const proxy = packageImportsSpecifierResolveMiddlewareProxy();
      proxy.setupImportingPackage({
        dirPath: '/repo/packages/mcp',
        packageJson: {
          name: '@dungeonmaster/mcp',
          imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
        },
      });
      const sourceFilePath = FilePathStub({ value: '/repo/packages/mcp/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '#foo' });

      const result = packageImportsSpecifierResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });

  describe('empty imports map', () => {
    it('EMPTY: {importing package has no imports field at all} => returns null', () => {
      const proxy = packageImportsSpecifierResolveMiddlewareProxy();
      proxy.setupImportingPackage({
        dirPath: '/repo/packages/mcp',
        packageJson: { name: '@dungeonmaster/mcp' },
      });
      const sourceFilePath = FilePathStub({ value: '/repo/packages/mcp/src/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '#gateway/npm/glob/glob/glob.proxy' });

      const result = packageImportsSpecifierResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });

  describe('no ancestor package.json', () => {
    it('EMPTY: {no ancestor has any package.json} => returns null', () => {
      packageImportsSpecifierResolveMiddlewareProxy();
      const sourceFilePath = FilePathStub({ value: '/unreachable/deep/path/a.proxy.ts' });
      const importPath = ImportPathStub({ value: '#gateway/npm/glob/glob/glob.proxy' });

      const result = packageImportsSpecifierResolveMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });
});
