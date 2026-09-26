import { existsSync, readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { findAncestorDirectoryLayerBrokerProxy } from './find-ancestor-directory-layer-broker.proxy';

export const resolveGatewayScopeLayerBrokerProxy = (): {
  setupRepoRoot: ({
    repoRoot,
    rootPackageJson,
  }: {
    repoRoot: string;
    rootPackageJson: Record<PropertyKey, unknown>;
  }) => void;
} => {
  // Constructed for their own default real-passthrough behavior and only to satisfy
  // enforce-proxy-child-creation — resolveGatewayScopeLayerBroker mocks the raw fs functions
  // below directly, since the walk probes many candidate paths no single adapter proxy addresses.
  fsReadFileSyncAdapterProxy();
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();
  findAncestorDirectoryLayerBrokerProxy();

  const existsHandle = registerMock({ fn: existsSync });
  const readHandle = registerMock({ fn: readFileSync });
  // No single path to key on: the walk probes many candidate directories, so the honest
  // catch-all is "nothing exists" and each test stages the one repo root that does.
  existsHandle.calledWith([]).implement(() => false);

  return {
    setupRepoRoot: ({
      repoRoot,
      rootPackageJson,
    }: {
      repoRoot: string;
      rootPackageJson: Record<PropertyKey, unknown>;
    }): void => {
      existsHandle.calledWith([`${repoRoot}/.dungeonmaster.json`]).returns(true);
      readHandle.calledWith([`${repoRoot}/package.json`]).returns(JSON.stringify(rootPackageJson));
    },
  };
};
