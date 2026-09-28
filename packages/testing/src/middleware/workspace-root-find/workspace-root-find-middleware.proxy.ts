/**
 * PURPOSE: Proxy for workspaceRootFindMiddleware — delegates to workspacePackageJsonReadMiddleware's
 * own proxy to stage which directory holds the workspaces root, and which directories along the
 * way hold a package.json that is NOT the root (so the upward walk keeps climbing past them).
 *
 * USAGE:
 * const proxy = workspaceRootFindMiddlewareProxy();
 * proxy.setupPlainPackageAt({ dirPath: '/repo/packages/bin/src' });
 * proxy.setupWorkspaceRootAt({ dirPath: '/repo' });
 * proxy.setupWorkspaceRootAt({ dirPath: '/repo', workspaces: ['packages/*', 'packages/@gateway/*'] });
 */

import { join } from '#gateway/node/path';
import { workspacePackageJsonReadMiddlewareProxy } from '../workspace-package-json-read/workspace-package-json-read-middleware.proxy';

const DEFAULT_WORKSPACE_GLOBS = ['packages/*'];

export const workspaceRootFindMiddlewareProxy = (): {
  setupWorkspaceRootAt: ({
    dirPath,
    workspaces,
  }: {
    dirPath: string;
    workspaces?: readonly string[];
  }) => void;
  setupPlainPackageAt: ({ dirPath }: { dirPath: string }) => void;
} => {
  const readProxy = workspacePackageJsonReadMiddlewareProxy();

  return {
    setupWorkspaceRootAt: ({
      dirPath,
      workspaces,
    }: {
      dirPath: string;
      workspaces?: readonly string[];
    }): void => {
      readProxy.setupPackageJsonAt({
        packageJsonPath: join(dirPath, 'package.json'),
        packageJson: { name: 'dungeonmaster', workspaces: workspaces ?? DEFAULT_WORKSPACE_GLOBS },
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
