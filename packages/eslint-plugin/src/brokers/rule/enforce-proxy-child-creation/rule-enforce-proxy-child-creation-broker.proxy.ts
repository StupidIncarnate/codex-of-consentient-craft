import { fsEnsureReadFileSyncAdapterProxy } from '../../../adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { findWorkspaceRootLayerBrokerProxy } from './find-workspace-root-layer-broker.proxy';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';

export const ruleEnforceProxyChildCreationBrokerProxy = (): {
  setupFileSystem: (args: { getContents: (filePath: FilePath) => FileContents | null }) => void;
} => {
  const adapterProxy = fsEnsureReadFileSyncAdapterProxy();
  // No extra staging: this shares the SAME existsSync mock fsEnsureReadFileSyncAdapterProxy already
  // wires, and the rule itself calls fsExistsSyncAdapter directly (the wrapper-proxy existence
  // check), so this composition alone satisfies enforce-proxy-child-creation.
  fsExistsSyncAdapterProxy();
  // Real passthrough default: the rule itself calls pathDirnameAdapter directly (not only through
  // findWorkspaceRootLayerBroker), so this satisfies enforce-proxy-child-creation with no staging.
  pathDirnameAdapterProxy();
  // findWorkspaceRootLayerBroker's own fs walk shares the SAME existsSync/readFileSync mocks
  // `setupFileSystem` below wires — constructing it here only satisfies enforce-proxy-child-creation
  // (it composes no scenario of its own); every test's own `getContents` callback still governs
  // every fs probe, including the ones this broker's walk makes, because `setupFileSystem` below
  // runs AFTER this constructor and its `[]`-addressed staging wins as the most recent registration.
  findWorkspaceRootLayerBrokerProxy();

  return {
    setupFileSystem: ({
      getContents,
    }: {
      getContents: (filePath: FilePath) => FileContents | null;
    }): void => {
      adapterProxy.setupFileSystem({ getContents });
    },
  };
};
