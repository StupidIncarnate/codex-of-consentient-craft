import { importPathResolverMiddleware } from './import-path-resolver-middleware';
import { importPathResolverMiddlewareProxy } from './import-path-resolver-middleware.proxy';

describe('importPathResolverMiddleware', () => {
  describe('relative imports', () => {
    it('VALID: {relative import to an existing .ts proxy file} => returns FilePath', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: ['/repo/src/widget/widget.proxy.ts'] });
      const sourceFilePath = '/repo/src/widget/widget.test.ts';
      const importPath = './widget.proxy';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual('/repo/src/widget/widget.proxy.ts');
    });

    it('VALID: {relative import that already carries its .ts extension} => returns FilePath as-is', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: ['/repo/src/widget/widget.ts'] });
      const sourceFilePath = '/repo/src/widget/widget.test.ts';
      const importPath = './widget.ts';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual('/repo/src/widget/widget.ts');
    });
  });

  describe('non-relative imports', () => {
    it('VALID: {absolute import path} => returns null', () => {
      importPathResolverMiddlewareProxy();
      const sourceFilePath = '/src/test.test.ts';
      const importPath = 'some-package';

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
      const sourceFilePath = '/repo/src/widget/widget.test.ts';
      const importPath = '@dungeonmaster/shared/testing';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual('/repo/packages/shared/testing.ts');
    });
  });

  describe('cross-package gateway testing subpaths', () => {
    it('VALID: {@dungeonmaster/bin/testing, literal "./testing" export} => returns resolved barrel path', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'bin',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: {
            './testing': { source: './testing.ts' },
            './*': { source: './src/*/*.ts' },
          },
        },
      });
      proxy.setupSourceFileExists({ filePath: '/repo/packages/bin/testing.ts' });
      const sourceFilePath =
        '/repo/packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.proxy.ts';
      const importPath = '@dungeonmaster/bin/testing';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual('/repo/packages/bin/testing.ts');
    });

    it('VALID: {@dungeonmaster/node/testing, only a wildcard export} => resolves through the "./*" pattern', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'node',
        packageJson: {
          name: '@dungeonmaster/node',
          exports: { './*': { source: './src/*/*.ts' } },
        },
      });
      proxy.setupSourceFileExists({ filePath: '/repo/packages/node/src/testing/testing.ts' });
      const sourceFilePath = '/repo/packages/hooks/src/a.proxy.ts';
      const importPath = '@dungeonmaster/node/testing';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual('/repo/packages/node/src/testing/testing.ts');
    });

    it('VALID: {matching package, resolved source file missing on disk} => returns null', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
      proxy.setupWorkspacePackage({
        workspaceRootPath: '/repo',
        packageFolderName: 'bin',
        packageJson: {
          name: '@dungeonmaster/bin',
          exports: { './testing': { source: './testing.ts' } },
        },
      });
      const sourceFilePath = '/repo/packages/hooks/src/a.proxy.ts';
      const importPath = '@dungeonmaster/bin/testing';

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
          exports: { './testing': { source: './testing.ts' } },
        },
      });
      const sourceFilePath = '/repo/packages/hooks/src/a.proxy.ts';
      const importPath = '@dungeonmaster/npm/testing';

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
          exports: { './git': { source: './git.ts' } },
        },
      });
      const sourceFilePath = '/repo/packages/hooks/src/a.proxy.ts';
      const importPath = '@dungeonmaster/bin/testing';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });

    it('VALID: {no ancestor package.json declares workspaces} => returns null', () => {
      importPathResolverMiddlewareProxy();
      const sourceFilePath = '/unreachable/deep/path/a.proxy.ts';
      const importPath = '@dungeonmaster/bin/testing';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });

  describe('gateway three-key exports form, order independent', () => {
    it('VALID: {@dungeonmaster/node/fs__promises/.../read-file-if-exists.proxy, keys in barrel/stub/proxy order} => resolves through the ".proxy" key', () => {
      const proxy = importPathResolverMiddlewareProxy();
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
      const sourceFilePath =
        '/repo/packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts';
      const importPath =
        '@dungeonmaster/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual(
        '/repo/packages/@gateway/node/src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts',
      );
    });
  });

  describe('imports-map "#" specifiers', () => {
    it("VALID: {#gateway/npm/glob/glob/glob.proxy} => resolves through the importing package's own imports map", () => {
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
          exports: { './*.proxy': { source: './src/*.proxy.ts' } },
        },
      });
      proxy.setupSourceFileExists({
        filePath: '/repo/packages/@gateway/npm/src/glob/glob/glob.proxy.ts',
      });
      const sourceFilePath =
        '/repo/packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts';
      const importPath = '#gateway/npm/glob/glob/glob.proxy';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual('/repo/packages/@gateway/npm/src/glob/glob/glob.proxy.ts');
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
      const sourceFilePath = '/repo/packages/mcp/src/a.proxy.ts';
      const importPath = '#foo';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });

  describe('tsx extension', () => {
    it('VALID: {relative import to a .tsx proxy file} => returns FilePath with .tsx', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: ['/repo/src/widgets/btn/btn-widget.proxy.tsx'] });
      const sourceFilePath = '/repo/src/widgets/btn/btn-widget.test.tsx';
      const importPath = './btn-widget.proxy';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual('/repo/src/widgets/btn/btn-widget.proxy.tsx');
    });
  });

  describe('jsx extension', () => {
    it('VALID: {relative import to a .jsx file} => returns FilePath with .jsx', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: ['/repo/src/widget/legacy.jsx'] });
      const sourceFilePath = '/repo/src/widget/widget.test.ts';
      const importPath = './legacy';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toStrictEqual('/repo/src/widget/legacy.jsx');
    });
  });

  describe('file not found', () => {
    it('VALID: {no candidate file exists} => returns null', () => {
      const proxy = importPathResolverMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: [] });
      const sourceFilePath = '/repo/src/widget/widget.test.ts';
      const importPath = './missing.proxy';

      const result = importPathResolverMiddleware({ sourceFilePath, importPath });

      expect(result).toBe(null);
    });
  });
});
