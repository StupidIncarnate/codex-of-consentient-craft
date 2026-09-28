/**
 * PURPOSE: Proxy for nearestPackageJsonFindMiddleware — delegates to
 * workspacePackageJsonReadMiddleware's own proxy to stage which directory holds a package.json
 * (any shape) and which directories along the way hold none, so the upward walk keeps climbing
 * past them.
 *
 * USAGE:
 * const proxy = nearestPackageJsonFindMiddlewareProxy();
 * proxy.setupPackageJsonAt({ dirPath: '/repo/packages/mcp', packageJson: {...} });
 * proxy.setupMissingAt({ dirPath: '/repo/packages/mcp/src' });
 */

import { join } from '#gateway/node/path';
import { workspacePackageJsonReadMiddlewareProxy } from '../workspace-package-json-read/workspace-package-json-read-middleware.proxy';

export const nearestPackageJsonFindMiddlewareProxy = (): {
  setupPackageJsonAt: ({
    dirPath,
    packageJson,
  }: {
    dirPath: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
  setupMissingAt: ({ dirPath }: { dirPath: string }) => void;
} => {
  const readProxy = workspacePackageJsonReadMiddlewareProxy();

  return {
    setupPackageJsonAt: ({
      dirPath,
      packageJson,
    }: {
      dirPath: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      readProxy.setupPackageJsonAt({ packageJsonPath: join(dirPath, 'package.json'), packageJson });
    },
    setupMissingAt: ({ dirPath }: { dirPath: string }): void => {
      readProxy.setupMissingAt({ packageJsonPath: join(dirPath, 'package.json') });
    },
  };
};
