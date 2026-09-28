import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract, type FileCount } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { findAncestorDirectoryLayerBrokerProxy } from './find-ancestor-directory-layer-broker.proxy';

export const resolvePackagePlatformLayerBrokerProxy = (): {
  setupPackageRoot: ({
    packageRoot,
    packageJson,
    hasWidgetsFolder,
    hasInkAdapter,
  }: {
    packageRoot: string;
    packageJson: Record<PropertyKey, unknown>;
    hasWidgetsFolder?: boolean;
    hasInkAdapter?: boolean;
  }) => void;
  setupNoPackageRoot: ({ dirs }: { dirs: readonly string[] }) => void;
  countPackageJsonReads: ({ packageRoot }: { packageRoot: string }) => FileCount;
} => {
  // Constructed for its own default real-passthrough behavior and only to satisfy
  // enforce-proxy-child-creation — resolvePackagePlatformLayerBroker's own existsSync calls, and
  // findAncestorDirectoryLayerBroker's real (unmocked) walk underneath it, share the SAME gateway
  // existsSync mock this proxy's own existsProxy stages below.
  fsReadFileSyncAdapterProxy();
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();
  findAncestorDirectoryLayerBrokerProxy();

  const existsProxy = existsSyncProxy();
  const readHandle = registerMock({ fn: readFileSync });

  return {
    setupPackageRoot: ({
      packageRoot,
      packageJson,
      hasWidgetsFolder = false,
      hasInkAdapter = false,
    }: {
      packageRoot: string;
      packageJson: Record<PropertyKey, unknown>;
      hasWidgetsFolder?: boolean;
      hasInkAdapter?: boolean;
    }): void => {
      existsProxy.returns({ path: `${packageRoot}/package.json`, exists: true });
      readHandle.calledWith([`${packageRoot}/package.json`]).returns(JSON.stringify(packageJson));
      // Both checks run unconditionally in production, so both need an explicit answer here
      // regardless of which flag is set — never only the "found" half.
      existsProxy.returns({ path: `${packageRoot}/src/widgets`, exists: hasWidgetsFolder });
      existsProxy.returns({ path: `${packageRoot}/src/adapters/ink`, exists: hasInkAdapter });
    },

    // existsSyncProxy ships no address-less catch-all: a walk-to-root "nothing found" test stages
    // every ancestor level's package.json explicitly false, one call per level. Mirrors real
    // path.join's own normalization: a root dir ('/') must not double the leading slash.
    setupNoPackageRoot: ({ dirs }: { dirs: readonly string[] }): void => {
      dirs.forEach((dir) => {
        existsProxy.returns({
          path: dir.endsWith('/') ? `${dir}package.json` : `${dir}/package.json`,
          exists: false,
        });
      });
    },

    countPackageJsonReads: ({ packageRoot }: { packageRoot: string }): FileCount =>
      fileCountContract.parse(readHandle.callsMatching([`${packageRoot}/package.json`]).length),
  };
};
