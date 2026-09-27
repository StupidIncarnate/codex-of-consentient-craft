/**
 * PURPOSE: Proxy for workspacePackageImportResolveMiddleware — composes the workspace-root and
 * package.json-read proxies underneath it, plus its own readdir/exists staging for the
 * `packages/*` scan (and any other workspaces glob's base dir, e.g. `packages/@gateway`) and the
 * final resolved source file.
 *
 * USAGE:
 * const proxy = workspacePackageImportResolveMiddlewareProxy();
 * proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
 * proxy.setupWorkspacePackage({
 *   workspaceRootPath: '/repo',
 *   packageFolderName: 'bin',
 *   packageJson: { name: '@dungeonmaster/bin', exports: { './testing': { source: './testing.ts' } } },
 * });
 * proxy.setupSourceFileExists({ filePath: '/repo/packages/bin/testing.ts' });
 *
 * // A group-folder package (packages/@gateway/npm), reachable once the root also declares that glob:
 * proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo', workspaces: ['packages/*', 'packages/@gateway/*'] });
 * proxy.setupWorkspacePackage({
 *   workspaceRootPath: '/repo',
 *   packageFolderName: 'npm',
 *   packagesBaseDir: 'packages/@gateway',
 *   packageJson: { name: '@dungeonmaster/npm', exports: { './*.proxy': { source: './src/*.proxy.ts' } } },
 * });
 */

import { join } from 'path';
import { fsExistsAdapterProxy } from '../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../adapters/path/join/path-join-adapter.proxy';
import { workspacePackageJsonReadMiddlewareProxy } from '../workspace-package-json-read/workspace-package-json-read-middleware.proxy';
import { workspaceRootFindMiddlewareProxy } from '../workspace-root-find/workspace-root-find-middleware.proxy';
import { FileNameStub } from '../../contracts/file-name/file-name.stub';

type FileName = ReturnType<typeof FileNameStub>;

const DEFAULT_PACKAGES_BASE_DIR = 'packages';

export const workspacePackageImportResolveMiddlewareProxy = (): {
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
  pathJoinAdapterProxy();
  const rootProxy = workspaceRootFindMiddlewareProxy();
  const readProxy = workspacePackageJsonReadMiddlewareProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  const existsProxy = fsExistsAdapterProxy();

  const folderNamesByPackagesDir = new Map<PropertyKey, FileName[]>();

  return {
    setupWorkspaceRoot: ({
      workspaceRootPath,
      workspaces,
    }: {
      workspaceRootPath: string;
      workspaces?: readonly string[];
    }): void => {
      rootProxy.setupWorkspaceRootAt({
        dirPath: workspaceRootPath,
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
      const packagesDirPath = join(workspaceRootPath, packagesBaseDir ?? DEFAULT_PACKAGES_BASE_DIR);
      const existingFolderNames = folderNamesByPackagesDir.get(packagesDirPath);
      const folderNames: FileName[] = [
        ...(existingFolderNames ?? []),
        FileNameStub({ value: packageFolderName }),
      ];
      folderNamesByPackagesDir.set(packagesDirPath, folderNames);
      readdirProxy.returns({ dirPath: packagesDirPath, files: folderNames });

      readProxy.setupPackageJsonAt({
        packageJsonPath: join(packagesDirPath, packageFolderName, 'package.json'),
        packageJson,
      });
    },

    setupSourceFileExists: ({ filePath }: { filePath: string }): void => {
      existsProxy.returns({ filePath, exists: true });
    },
  };
};
