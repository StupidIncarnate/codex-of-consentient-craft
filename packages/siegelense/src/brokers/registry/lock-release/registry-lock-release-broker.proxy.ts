import { locationsRegistryLockPathFindBrokerProxy } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

const HOME_DIR = '/home/user';
const REGISTRY_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/registry.lock`;

export const registryLockReleaseBrokerProxy = (): {
  lockPath: ReturnType<typeof AbsoluteFilePathStub>;
  setupReleaseSucceeds: () => void;
  setupReleaseFails: (params: { error: Error }) => void;
  getDeletedPaths: () => unknown[];
} => {
  const lockPath = AbsoluteFilePathStub({ value: REGISTRY_LOCK_VALUE });

  const pathProxy = locationsRegistryLockPathFindBrokerProxy();
  // Staged inside each setup method, never at construction — pathJoinAdapterProxy's queue is
  // shared across every composed proxy in a test, so pre-staging here would answer some OTHER
  // proxy's earlier real call (registryLockAcquireBroker's, registryReadBroker's) instead of
  // this broker's own single real call, which always happens last in the read-mutate-write cycle.
  const stagePathResolution = (): void => {
    pathProxy.setupRegistryLockPath({
      homeDir: HOME_DIR,
      homePath: FilePathStub({ value: `${HOME_DIR}/.dungeonmaster` }),
      rootPath: FilePathStub({ value: `${HOME_DIR}/.dungeonmaster/siegelense` }),
      registryLockPath: FilePathStub({ value: REGISTRY_LOCK_VALUE }),
    });
  };

  const unlinkProxy = fsUnlinkAdapterProxy();

  return {
    lockPath,

    setupReleaseSucceeds: (): void => {
      stagePathResolution();
      unlinkProxy.succeeds({ filePath: lockPath });
    },

    setupReleaseFails: ({ error }: { error: Error }): void => {
      stagePathResolution();
      unlinkProxy.throws({ filePath: lockPath, error });
    },

    getDeletedPaths: (): unknown[] => unlinkProxy.getDeletedPaths(),
  };
};
