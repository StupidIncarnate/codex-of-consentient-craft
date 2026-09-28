import { fileCountContract, type FileCount } from '@dungeonmaster/shared/contracts';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { findPackageJsonDirLayerBrokerProxy } from './find-package-json-dir-layer-broker.proxy';

export const findNearestPackageJsonLayerBrokerProxy = (): {
  setupPackageJson: (args: {
    packageDir: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
  setupNoPackageJsonAt: (args: { dirPath: string }) => void;
  countPackageJsonReads: (args: { packageDir: string }) => FileCount;
} => {
  const readProxy = readFileSyncProxy();
  pathJoinAdapterProxy();
  const dirProxy = findPackageJsonDirLayerBrokerProxy();

  return {
    // Stages the package.json at `packageDir` present and readable, and every package.json in a
    // directory NESTED under it absent: the walk starts at a file's own directory (however deep)
    // and probes each level up to `packageDir`, so the levels below it are the stated "nothing
    // here" half of the same fixture, addressed by "is a descendant of packageDir", not by a
    // catch-all.
    setupPackageJson: ({
      packageDir,
      packageJson,
    }: {
      packageDir: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      const packageJsonPath = `${packageDir}/package.json`;
      dirProxy.setupNoPackageJsonBelow({ dirPath: packageDir });
      dirProxy.setupPackageJsonAt({ dirPath: packageDir });
      readProxy.returns({ path: packageJsonPath, contents: JSON.stringify(packageJson) });
    },

    // existsSyncProxy ships no address-less catch-all: a walk-to-root "nothing found" test stages
    // every ancestor level explicitly false, one call per level.
    setupNoPackageJsonAt: ({ dirPath }: { dirPath: string }): void => {
      dirProxy.setupNoPackageJsonAt({ dirPath });
    },

    countPackageJsonReads: ({ packageDir }: { packageDir: string }): FileCount =>
      fileCountContract.parse(readProxy.getCallsFor({ path: `${packageDir}/package.json` }).length),
  };
};
