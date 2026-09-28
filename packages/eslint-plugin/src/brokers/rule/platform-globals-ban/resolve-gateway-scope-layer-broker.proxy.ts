import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { findAncestorDirectoryLayerBrokerProxy } from './find-ancestor-directory-layer-broker.proxy';

const REPO_ROOT_MARKER = '.dungeonmaster.json';

export const resolveGatewayScopeLayerBrokerProxy = (): {
  setupRepoRoot: ({
    repoRoot,
    rootPackageJson,
  }: {
    repoRoot: string;
    rootPackageJson: Record<PropertyKey, unknown>;
  }) => void;
  setupNoRepoRootAt: ({ dirPath }: { dirPath: string }) => void;
} => {
  const readProxy = readFileSyncProxy();
  const ancestorProxy = findAncestorDirectoryLayerBrokerProxy();

  return {
    // The marker at `repoRoot` is present and its package.json readable; the marker in every
    // directory NESTED under `repoRoot` is absent — the walk starts at the linted file's own
    // directory and probes each level up, so those levels are the stated "nothing here" half of
    // the fixture, addressed as "descendant of repoRoot", not by a catch-all.
    setupRepoRoot: ({
      repoRoot,
      rootPackageJson,
    }: {
      repoRoot: string;
      rootPackageJson: Record<PropertyKey, unknown>;
    }): void => {
      ancestorProxy.setupNoMarkerBelow({ dirPath: repoRoot, markerFileName: REPO_ROOT_MARKER });
      ancestorProxy.setupMarkerAt({ dirPath: repoRoot, markerFileName: REPO_ROOT_MARKER });
      readProxy.returns({
        path: `${repoRoot}/package.json`,
        contents: JSON.stringify(rootPackageJson),
      });
    },

    // existsSyncProxy ships no address-less catch-all: a walk-to-root "nothing found" test stages
    // every ancestor level explicitly false, one call per level.
    setupNoRepoRootAt: ({ dirPath }: { dirPath: string }): void => {
      ancestorProxy.setupNoMarkerAt({ dirPath, markerFileName: REPO_ROOT_MARKER });
    },
  };
};
