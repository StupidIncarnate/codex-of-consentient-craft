/**
 * PURPOSE: Proxy for findRepoRootLayerBroker
 *
 * USAGE:
 * const proxy = findRepoRootLayerBrokerProxy();
 * proxy.setupWorkspacesRootAt({ dirPath: '/fake/repo' });
 * proxy.setupPlainPackageAt({ dirPath: '/fake/repo/packages/sub' });
 * // Constructor also stages a default workspaces root at this proxy's own __dirname, so any
 * // composing broker's proxy (installTestbedCreateBrokerProxy) resolves without further setup.
 * // Every other path answers "does not exist", so an upward walk climbs past what a test never
 * // describes.
 */

import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { join } from '#gateway/node/path';

const isPath = (candidate: unknown): boolean => typeof candidate === 'string';

export const findRepoRootLayerBrokerProxy = (): {
  setupWorkspacesRootAt: ({ dirPath }: { dirPath: string }) => void;
  setupPlainPackageAt: ({ dirPath }: { dirPath: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readFileProxy = readFileSyncProxy();

  // Staged FIRST: a predicate and an exact path score the same, and the later staging wins, so
  // every exact path staged below (and by any composing proxy) outranks this "not there" default.
  existsProxy.returnsMatchingPath({ path: isPath, exists: false });

  // Catch-all: installTestbedCreateBrokerProxy composes this proxy without describing its own
  // walk, so this proxy's own __dirname (the same directory findRepoRootLayerBroker's real
  // caller starts from) defaults to a synthetic workspaces root. That resolves the walk on the
  // first check instead of climbing to the filesystem root and throwing.
  const defaultPackageJsonPath = join(__dirname, 'package.json');
  existsProxy.returns({ path: defaultPackageJsonPath, exists: true });
  readFileProxy.returns({
    path: defaultPackageJsonPath,
    contents: JSON.stringify({ workspaces: ['packages/*'] }),
  });

  return {
    setupWorkspacesRootAt: ({ dirPath }: { dirPath: string }): void => {
      const packageJsonPath = join(dirPath, 'package.json');
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readFileProxy.returns({
        path: packageJsonPath,
        contents: JSON.stringify({ workspaces: ['packages/*'] }),
      });
    },
    setupPlainPackageAt: ({ dirPath }: { dirPath: string }): void => {
      const packageJsonPath = join(dirPath, 'package.json');
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readFileProxy.returns({
        path: packageJsonPath,
        contents: JSON.stringify({ name: 'sub-package' }),
      });
    },
  };
};
