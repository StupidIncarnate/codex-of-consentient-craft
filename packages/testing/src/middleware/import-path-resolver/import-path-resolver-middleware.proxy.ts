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

import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathResolveAdapterProxy } from '../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { packageImportsSpecifierResolveMiddlewareProxy } from '../package-imports-specifier-resolve/package-imports-specifier-resolve-middleware.proxy';
import { workspacePackageImportResolveMiddlewareProxy } from '../workspace-package-import-resolve/workspace-package-import-resolve-middleware.proxy';

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
  pathDirnameAdapterProxy();
  pathResolveAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const workspaceImportProxy = workspacePackageImportResolveMiddlewareProxy();
  const importsSpecifierProxy = packageImportsSpecifierResolveMiddlewareProxy();

  return {
    setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }): void => {
      existsProxy.existsOnlyFor({ filePaths });
    },
    setupFilesOnDiskMatching: ({ pattern }: { pattern: RegExp }): void => {
      existsProxy.existsWhereMatching({ pattern });
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
