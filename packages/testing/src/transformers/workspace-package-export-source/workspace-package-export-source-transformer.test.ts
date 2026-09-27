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
    it('VALID: {subpath: "testing", "./*" -> "./src/*/index.ts"} => substitutes the captured segment', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/bin',
        exports: { './*': { source: './src/*/index.ts' } },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/bin',
        subpath: 'testing',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/testing/index.ts');
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
          './testing': { source: './src/testing/index.ts' },
          './*': { source: './src/*/index.ts' },
        },
      });
      const { subpath } = PackageSpecifierPartsStub({
        packageName: '@dungeonmaster/bin',
        subpath: 'testing',
      });

      const result = workspacePackageExportSourceTransformer({ exportsMap, subpath });

      expect(result).toBe('./src/testing/index.ts');
    });
  });

  describe('no match', () => {
    it('INVALID: {subpath: "testing", only an unrelated "./git" export} => returns null', () => {
      const { exports: exportsMap } = WorkspacePackageJsonStub({
        name: '@dungeonmaster/bin',
        exports: { './git': { source: './src/git/index.ts' } },
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
