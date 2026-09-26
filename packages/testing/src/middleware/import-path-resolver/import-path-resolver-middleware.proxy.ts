/**
 * PURPOSE: Proxy for import-path-resolver-middleware — stages which candidate files exist for the
 * relative-import extension search, and delegates the cross-package workspace subpath staging to
 * workspacePackageImportResolveMiddlewareProxy so both branches share one description of the fake
 * filesystem.
 *
 * USAGE:
 * const proxy = importPathResolverMiddlewareProxy();
 * proxy.setupFilesOnDisk({ filePaths: ['/repo/src/a.proxy.ts'] });
 * proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
 * proxy.setupWorkspacePackage({
 *   workspaceRootPath: '/repo',
 *   packageFolderName: 'bin',
 *   packageJson: { name: '@dungeonmaster/bin', exports: { './testing': { source: './src/testing/index.ts' } } },
 * });
 * proxy.setupSourceFileExists({ filePath: '/repo/packages/bin/src/testing/index.ts' });
 */

import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathResolveAdapterProxy } from '../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { workspacePackageImportResolveMiddlewareProxy } from '../workspace-package-import-resolve/workspace-package-import-resolve-middleware.proxy';

export const importPathResolverMiddlewareProxy = (): {
  setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }) => void;
  setupFilesOnDiskMatching: ({ pattern }: { pattern: RegExp }) => void;
  setupWorkspaceRoot: ({ workspaceRootPath }: { workspaceRootPath: string }) => void;
  setupWorkspacePackage: ({
    workspaceRootPath,
    packageFolderName,
    packageJson,
  }: {
    workspaceRootPath: string;
    packageFolderName: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
  setupSourceFileExists: ({ filePath }: { filePath: string }) => void;
} => {
  pathDirnameAdapterProxy();
  pathResolveAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const workspaceImportProxy = workspacePackageImportResolveMiddlewareProxy();

  return {
    setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }): void => {
      existsProxy.existsOnlyFor({ filePaths });
    },
    setupFilesOnDiskMatching: ({ pattern }: { pattern: RegExp }): void => {
      existsProxy.existsWhereMatching({ pattern });
    },

    setupWorkspaceRoot: ({ workspaceRootPath }: { workspaceRootPath: string }): void => {
      workspaceImportProxy.setupWorkspaceRoot({ workspaceRootPath });
    },
    setupWorkspacePackage: ({
      workspaceRootPath,
      packageFolderName,
      packageJson,
    }: {
      workspaceRootPath: string;
      packageFolderName: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      workspaceImportProxy.setupWorkspacePackage({
        workspaceRootPath,
        packageFolderName,
        packageJson,
      });
    },
    setupSourceFileExists: ({ filePath }: { filePath: string }): void => {
      workspaceImportProxy.setupSourceFileExists({ filePath });
    },
  };
};
