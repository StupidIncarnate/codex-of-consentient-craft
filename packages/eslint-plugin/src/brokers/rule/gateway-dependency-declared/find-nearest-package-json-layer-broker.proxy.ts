import { existsSync, readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fileCountContract, type FileCount } from '@dungeonmaster/shared/contracts';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { findPackageJsonDirLayerBrokerProxy } from './find-package-json-dir-layer-broker.proxy';

export const findNearestPackageJsonLayerBrokerProxy = (): {
  setupPackageJson: (args: {
    packageDir: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
  countPackageJsonReads: (args: { packageDir: string }) => FileCount;
} => {
  // Constructed for their own default real-passthrough behavior and only to satisfy
  // enforce-proxy-child-creation — the raw `existsSync` used for the exists+read staging pair
  // below is reached through findPackageJsonDirLayerBrokerProxy's own child, not directly imported
  // here, since findNearestPackageJsonLayerBroker itself never calls fsExistsSyncAdapter.
  fsReadFileSyncAdapterProxy();
  pathJoinAdapterProxy();
  findPackageJsonDirLayerBrokerProxy();

  const existsHandle = registerMock({ fn: existsSync });
  const readHandle = registerMock({ fn: readFileSync });
  // No single path to key on: the walk probes many candidate directories, so the honest catch-all
  // is "nothing exists" and each test stages the one package directory that does.
  existsHandle.calledWith([]).implement(() => false);

  return {
    setupPackageJson: ({
      packageDir,
      packageJson,
    }: {
      packageDir: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      existsHandle.calledWith([`${packageDir}/package.json`]).returns(true);
      readHandle.calledWith([`${packageDir}/package.json`]).returns(JSON.stringify(packageJson));
    },
    countPackageJsonReads: ({ packageDir }: { packageDir: string }): FileCount =>
      fileCountContract.parse(readHandle.callsMatching([`${packageDir}/package.json`]).length),
  };
};
