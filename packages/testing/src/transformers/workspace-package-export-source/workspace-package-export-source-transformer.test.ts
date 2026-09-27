import { workspacePackageExportSourceTransformer } from './workspace-package-export-source-transformer';
import { WorkspacePackageJsonStub } from '../../contracts/workspace-package-json/workspace-package-json.stub';
import { PackageSpecifierPartsStub } from '../../contracts/package-specifier-parts/package-specifier-parts.stub';

describe('workspacePackageExportSourceTransformer', () => {
  describe('literal export key', () => {
    it('VALID: {subpath: "testing", literal "./testing" export} => returns its source', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/shared',
        exports: { './testing': { source: './testing.ts' } },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/shared',
        subpath: 'testing',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./testing.ts');
    });
  });

  describe('wildcard export key', () => {
    it('VALID: {subpath: "glob.proxy", "./*.proxy" -> "./src/*.proxy.ts"} => substitutes the captured segment', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/npm',
        exports: { './*.proxy': { source: './src/*.proxy.ts' } },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/npm',
        subpath: 'glob.proxy',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/glob.proxy.ts');
    });

    it('VALID: {subpath: "git", "./*" -> "./src/*/*.ts"} => substitutes the captured segment for every star', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/bin',
        exports: { './*': { source: './src/*/*.ts' } },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/bin',
        subpath: 'git',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/git/git.ts');
    });

    it('VALID: {subpath: "_test_/git", "./*" listed before "./_test_/*"} => the longer-prefix key wins', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/bin',
        exports: {
          './*': { source: './src/*/*.ts' },
          './_test_/*': { source: './src/*/*.proxy.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/bin',
        subpath: '_test_/git',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/git/git.proxy.ts');
    });

    it('VALID: {literal AND wildcard both present} => the literal key wins', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/bin',
        exports: {
          './testing': { source: './testing.ts' },
          './*': { source: './src/*/*.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/bin',
        subpath: 'testing',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./testing.ts');
    });
  });

  describe('bare string export value', () => {
    it('VALID: {subpath: "jest-config-base", literal key holds a bare string} => returns it as the source', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/testing',
        exports: { './jest-config-base': './jest-config-base.js' },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/testing',
        subpath: 'jest-config-base',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./jest-config-base.js');
    });
  });

  describe('no match', () => {
    it('INVALID: {subpath: "testing", only an unrelated "./git" export} => returns null', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/bin',
        exports: { './git': { source: './git.ts' } },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/bin',
        subpath: 'testing',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe(null);
    });

    it('INVALID: {matching entry has no "source" field} => returns null', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/npm',
        exports: { './axios': {} },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/npm',
        subpath: 'axios',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe(null);
    });
  });

  describe('gateway three-key form, order independent', () => {
    it('VALID: {subpath ends in .proxy, keys in proxy/stub/barrel order} => the .proxy key wins', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/node',
        exports: {
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './*': { source: './src/*/*.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/node',
        subpath: 'fs__promises/read-file-if-exists/read-file-if-exists.proxy',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts');
    });

    it('VALID: {subpath ends in .proxy, keys in barrel/stub/proxy order} => the .proxy key still wins', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/node',
        exports: {
          './*': { source: './src/*/*.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './*.proxy': { source: './src/*.proxy.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/node',
        subpath: 'fs__promises/read-file-if-exists/read-file-if-exists.proxy',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/fs__promises/read-file-if-exists/read-file-if-exists.proxy.ts');
    });

    it('VALID: {subpath ends in .stub, keys in proxy/stub/barrel order} => the .stub key wins', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/node',
        exports: {
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './*': { source: './src/*/*.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/node',
        subpath: 'fs/is-fs-error/fs-error.stub',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/fs/is-fs-error/fs-error.stub.ts');
    });

    it('VALID: {subpath ends in .stub, keys in barrel/proxy/stub order} => the .stub key still wins', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/node',
        exports: {
          './*': { source: './src/*/*.ts' },
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/node',
        subpath: 'fs/is-fs-error/fs-error.stub',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/fs/is-fs-error/fs-error.stub.ts');
    });

    it('VALID: {subpath is a plain barrel path, keys in proxy/stub/barrel order} => the "./*" key wins', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/node',
        exports: {
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './*': { source: './src/*/*.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/node',
        subpath: 'fs__promises',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/fs__promises/fs__promises.ts');
    });

    it('VALID: {subpath is a plain barrel path, keys in barrel/stub/proxy order} => the "./*" key still wins', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/node',
        exports: {
          './*': { source: './src/*/*.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './*.proxy': { source: './src/*.proxy.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/node',
        subpath: 'fs__promises',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/fs__promises/fs__promises.ts');
    });

    it('VALID: {all four gateway keys present, "./_test_/*" listed last} => "./_test_/*" still beats "./*" for a "_test_/" subpath', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/node',
        exports: {
          './*.proxy': { source: './src/*.proxy.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './*': { source: './src/*/*.ts' },
          './_test_/*': { source: './src/*/*.proxy.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/node',
        subpath: '_test_/fs__promises',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/fs__promises/fs__promises.proxy.ts');
    });

    it('VALID: {all four gateway keys present, "./_test_/*" listed first} => "./_test_/*" still beats "./*" for a "_test_/" subpath', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/node',
        exports: {
          './_test_/*': { source: './src/*/*.proxy.ts' },
          './*': { source: './src/*/*.ts' },
          './*.stub': { source: './src/*.stub.ts' },
          './*.proxy': { source: './src/*.proxy.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/node',
        subpath: '_test_/fs__promises',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/fs__promises/fs__promises.proxy.ts');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {exportsMap: undefined} => returns null', () => {
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/bin',
        subpath: 'testing',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap: undefined, subpath });

      expect(result).toBe(null);
    });
  });
});
