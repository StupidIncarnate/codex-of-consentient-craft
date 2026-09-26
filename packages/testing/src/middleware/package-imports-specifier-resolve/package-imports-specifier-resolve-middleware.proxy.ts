/**
 * PURPOSE: Proxy for packageImportsSpecifierResolveMiddleware — composes the nearest-package-json
 * and workspace-package-import-resolve proxies underneath it, so a test describes one
 * `#`-specifier scenario without touching either child proxy's own mocks directly.
 *
 * USAGE:
 * const proxy = packageImportsSpecifierResolveMiddlewareProxy();
 * proxy.setupImportingPackage({
 *   dirPath: '/repo/packages/mcp',
 *   packageJson: { name: '@dungeonmaster/mcp', imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' } },
 * });
 * proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo', workspaces: ['packages/*', 'packages/@gateway/*'] });
 * proxy.setupWorkspacePackage({
 *   workspaceRootPath: '/repo',
 *   packageFolderName: 'npm',
 *   packagesBaseDir: 'packages/@gateway',
 *   packageJson: { name: '@dungeonmaster/npm', exports: { './_test_': { source: './src/_test_/index.ts' } } },
 * });
 * proxy.setupSourceFileExists({ filePath: '/repo/packages/@gateway/npm/src/_test_/index.ts' });
 */

import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { nearestPackageJsonFindMiddlewareProxy } from '../nearest-package-json-find/nearest-package-json-find-middleware.proxy';
import { workspacePackageImportResolveMiddlewareProxy } from '../workspace-package-import-resolve/workspace-package-import-resolve-middleware.proxy';

export const packageImportsSpecifierResolveMiddlewareProxy = (): {
  setupImportingPackage: ({
    dirPath,
    packageJson,
  }: {
    dirPath: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
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
} => {
  pathDirnameAdapterProxy();
  const nearestProxy = nearestPackageJsonFindMiddlewareProxy();
  const resolveProxy = workspacePackageImportResolveMiddlewareProxy();

  return {
    setupImportingPackage: ({
      dirPath,
      packageJson,
    }: {
      dirPath: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      nearestProxy.setupPackageJsonAt({ dirPath, packageJson });
    },
    setupWorkspaceRoot: ({
      workspaceRootPath,
      workspaces,
    }: {
      workspaceRootPath: string;
      workspaces?: readonly string[];
    }): void => {
      resolveProxy.setupWorkspaceRoot({ workspaceRootPath, ...(workspaces && { workspaces }) });
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
      resolveProxy.setupWorkspacePackage({
        workspaceRootPath,
        packageFolderName,
        packageJson,
        ...(packagesBaseDir && { packagesBaseDir }),
      });
    },
    setupSourceFileExists: ({ filePath }: { filePath: string }): void => {
      resolveProxy.setupSourceFileExists({ filePath });
    },
  };
};
