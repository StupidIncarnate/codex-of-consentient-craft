/**
 * PURPOSE: Proxy for import-path-resolver-middleware — stages which candidate files exist for the
 * relative-import extension search, and delegates the cross-package workspace subpath staging to
 * workspacePackageImportResolveMiddlewareProxy, plus the `#`-specifier staging to
 * packageImportsSpecifierResolveMiddlewareProxy, so every branch shares one description of the fake
 * filesystem.
 *
 * USAGE:
 * const proxy = importPathResolverMiddlewareProxy();
 * proxy.setupFilesOnDisk({ filePaths: ['/repo/src/a.proxy.ts'] });
 * proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
 * proxy.setupWorkspacePackage({
 *   workspaceRootPath: '/repo',
 *   packageFolderName: 'bin',
 *   packageJson: { name: '@dungeonmaster/bin', exports: { './testing': { source: './testing.ts' } } },
 * });
 * proxy.setupSourceFileExists({ filePath: '/repo/packages/bin/testing.ts' });
 * proxy.setupImportingPackage({
 *   dirPath: '/repo/packages/mcp',
 *   packageJson: { name: '@dungeonmaster/mcp', imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' } },
 * });
 */

import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { packageImportsSpecifierResolveMiddlewareProxy } from '../package-imports-specifier-resolve/package-imports-specifier-resolve-middleware.proxy';
import { workspacePackageImportResolveMiddlewareProxy } from '../workspace-package-import-resolve/workspace-package-import-resolve-middleware.proxy';

const isPath = (candidate: unknown): boolean => typeof candidate === 'string';

export const importPathResolverMiddlewareProxy = (): {
  setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }) => void;
  setupFilesOnDiskMatching: ({ pattern }: { pattern: RegExp }) => void;
  setupWorkspaceRoot: ({
    workspaceRootPath,
    workspaces,
  }: {
    workspaceRootPath: string;
    workspaces?: readonly string[];
  }) => void;
  setupWorkspacePackage: ({
    workspaceRootPath,
    packageFolderName,
    packageJson,
    packagesBaseDir,
  }: {
    workspaceRootPath: string;
    packageFolderName: string;
    packageJson: Record<PropertyKey, unknown>;
    packagesBaseDir?: string;
  }) => void;
  setupSourceFileExists: ({ filePath }: { filePath: string }) => void;
  setupImportingPackage: ({
    dirPath,
    packageJson,
  }: {
    dirPath: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const workspaceImportProxy = workspacePackageImportResolveMiddlewareProxy();
  const importsSpecifierProxy = packageImportsSpecifierResolveMiddlewareProxy();

  return {
    // Every path is answered: false by default, then true for the ones listed. A predicate and an
    // exact path score the same and the later staging wins, so the listed answer comes second.
    setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }): void => {
      existsProxy.returnsMatchingPath({ path: isPath, exists: false });
      existsProxy.returnsMatchingPath({
        path: (candidate: unknown): boolean =>
          typeof candidate === 'string' && filePaths.includes(candidate),
        exists: true,
      });
    },
    setupFilesOnDiskMatching: ({ pattern }: { pattern: RegExp }): void => {
      existsProxy.returnsMatchingPath({ path: isPath, exists: false });
      existsProxy.returnsMatchingPath({
        path: (candidate: unknown): boolean =>
          typeof candidate === 'string' && pattern.test(candidate),
        exists: true,
      });
    },

    setupWorkspaceRoot: ({
      workspaceRootPath,
      workspaces,
    }: {
      workspaceRootPath: string;
      workspaces?: readonly string[];
    }): void => {
      workspaceImportProxy.setupWorkspaceRoot({
        workspaceRootPath,
        ...(workspaces && { workspaces }),
      });
    },
    setupWorkspacePackage: ({
      workspaceRootPath,
      packageFolderName,
      packageJson,
      packagesBaseDir,
    }: {
      workspaceRootPath: string;
      packageFolderName: string;
      packageJson: Record<PropertyKey, unknown>;
      packagesBaseDir?: string;
    }): void => {
      workspaceImportProxy.setupWorkspacePackage({
        workspaceRootPath,
        packageFolderName,
        packageJson,
        ...(packagesBaseDir && { packagesBaseDir }),
      });
    },
    setupSourceFileExists: ({ filePath }: { filePath: string }): void => {
      workspaceImportProxy.setupSourceFileExists({ filePath });
    },
    setupImportingPackage: ({
      dirPath,
      packageJson,
    }: {
      dirPath: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      importsSpecifierProxy.setupImportingPackage({ dirPath, packageJson });
    },
  };
};
