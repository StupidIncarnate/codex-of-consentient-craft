/**
 * PURPOSE: Proxy for workspacePackageImportResolveMiddleware — composes the workspace-root and
 * package.json-read proxies underneath it, plus its own readdir/exists staging for the
 * `packages/*` scan and the final resolved source file.
 *
 * USAGE:
 * const proxy = workspacePackageImportResolveMiddlewareProxy();
 * proxy.setupWorkspaceRoot({ workspaceRootPath: '/repo' });
 * proxy.setupWorkspacePackage({
 *   workspaceRootPath: '/repo',
 *   packageFolderName: 'bin',
 *   packageJson: { name: '@dungeonmaster/bin', exports: { './testing': { source: './src/testing/index.ts' } } },
 * });
 * proxy.setupSourceFileExists({ filePath: '/repo/packages/bin/src/testing/index.ts' });
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

export const workspacePackageImportResolveMiddlewareProxy = (): {
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
  pathJoinAdapterProxy();
  const rootProxy = workspaceRootFindMiddlewareProxy();
  const readProxy = workspacePackageJsonReadMiddlewareProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  const existsProxy = fsExistsAdapterProxy();

  const folderNamesByPackagesDir = new Map<PropertyKey, FileName[]>();

  return {
    setupWorkspaceRoot: ({ workspaceRootPath }: { workspaceRootPath: string }): void => {
      rootProxy.setupWorkspaceRootAt({ dirPath: workspaceRootPath });
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
      const packagesDirPath = join(workspaceRootPath, 'packages');
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
