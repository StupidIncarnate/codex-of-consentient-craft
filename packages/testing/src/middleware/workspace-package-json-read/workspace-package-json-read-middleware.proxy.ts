/**
 * PURPOSE: Proxy for workspacePackageJsonReadMiddleware — stages a package.json's existence and
 * raw JSON content, addressed by its path.
 *
 * USAGE:
 * const proxy = workspacePackageJsonReadMiddlewareProxy();
 * proxy.setupPackageJsonAt({ packageJsonPath: '/repo/packages/bin/package.json', packageJson: {...} });
 * proxy.setupMissingAt({ packageJsonPath: '/repo/packages/ghost/package.json' });
 */

import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

const isPath = (candidate: unknown): boolean => typeof candidate === 'string';

export const workspacePackageJsonReadMiddlewareProxy = (): {
  setupPackageJsonAt: ({
    packageJsonPath,
    packageJson,
  }: {
    packageJsonPath: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
  setupMissingAt: ({ packageJsonPath }: { packageJsonPath: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readFileProxy = readFileSyncProxy();

  // Staged FIRST: a predicate and an exact path score the same and the later staging wins, so
  // every exact path staged below outranks this "not there" default.
  existsProxy.returnsMatchingPath({ path: isPath, exists: false });

  return {
    setupPackageJsonAt: ({
      packageJsonPath,
      packageJson,
    }: {
      packageJsonPath: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readFileProxy.returns({ path: packageJsonPath, contents: JSON.stringify(packageJson) });
    },
    setupMissingAt: ({ packageJsonPath }: { packageJsonPath: string }): void => {
      existsProxy.returns({ path: packageJsonPath, exists: false });
    },
  };
};
