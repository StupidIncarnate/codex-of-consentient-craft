/**
 * PURPOSE: Proxy for workspaceRootFindMiddleware — delegates to workspacePackageJsonReadMiddleware's
 * own proxy to stage which directory holds the workspaces root, and which directories along the
 * way hold a package.json that is NOT the root (so the upward walk keeps climbing past them).
 *
 * USAGE:
 * const proxy = workspaceRootFindMiddlewareProxy();
 * proxy.setupPlainPackageAt({ dirPath: '/repo/packages/bin/src' });
 * proxy.setupWorkspaceRootAt({ dirPath: '/repo' });
 */

import { join } from 'path';
import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../adapters/path/join/path-join-adapter.proxy';
import { workspacePackageJsonReadMiddlewareProxy } from '../workspace-package-json-read/workspace-package-json-read-middleware.proxy';

export const workspaceRootFindMiddlewareProxy = (): {
  setupWorkspaceRootAt: ({ dirPath }: { dirPath: string }) => void;
  setupPlainPackageAt: ({ dirPath }: { dirPath: string }) => void;
} => {
  pathDirnameAdapterProxy();
  pathJoinAdapterProxy();
  const readProxy = workspacePackageJsonReadMiddlewareProxy();

  return {
    setupWorkspaceRootAt: ({ dirPath }: { dirPath: string }): void => {
      readProxy.setupPackageJsonAt({
        packageJsonPath: join(dirPath, 'package.json'),
        packageJson: { name: 'dungeonmaster', workspaces: ['packages/*'] },
      });
    },
    setupPlainPackageAt: ({ dirPath }: { dirPath: string }): void => {
      readProxy.setupPackageJsonAt({
        packageJsonPath: join(dirPath, 'package.json'),
        packageJson: { name: 'sub-package' },
      });
    },
  };
};
