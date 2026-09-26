import { existsSync, readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract, type FileCount } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
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
  countPackageJsonReads: ({ packageRoot }: { packageRoot: string }) => FileCount;
} => {
  // Constructed for their own default real-passthrough behavior and only to satisfy
  // enforce-proxy-child-creation — resolvePackagePlatformLayerBroker mocks the raw fs functions
  // below directly, since the walk probes many candidate paths no single adapter proxy addresses.
  fsExistsSyncAdapterProxy();
  fsReadFileSyncAdapterProxy();
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();
  findAncestorDirectoryLayerBrokerProxy();

  const existsHandle = registerMock({ fn: existsSync });
  const readHandle = registerMock({ fn: readFileSync });
  // No single path to key on: platform detection probes several candidate paths per package, so
  // the honest catch-all is "nothing exists" and each test stages the one package that does.
  existsHandle.calledWith([]).implement(() => false);

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
      existsHandle.calledWith([`${packageRoot}/package.json`]).returns(true);
      readHandle.calledWith([`${packageRoot}/package.json`]).returns(JSON.stringify(packageJson));
      if (hasWidgetsFolder) {
        existsHandle.calledWith([`${packageRoot}/src/widgets`]).returns(true);
      }
      if (hasInkAdapter) {
        existsHandle.calledWith([`${packageRoot}/src/adapters/ink`]).returns(true);
      }
    },
    countPackageJsonReads: ({ packageRoot }: { packageRoot: string }): FileCount =>
      fileCountContract.parse(readHandle.callsMatching([`${packageRoot}/package.json`]).length),
  };
};
