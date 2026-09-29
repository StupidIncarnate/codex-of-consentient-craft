import type { FsError } from '#gateway/node/fs';
import { locationsRegistryLockPathFindBrokerProxy } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker.proxy';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

const HOME_DIR = '/home/user';
const REGISTRY_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/registry.lock`;

export const registryLockReleaseBrokerProxy = (): {
  lockPath: ReturnType<typeof AbsoluteFilePathStub>;
  setupReleaseSucceeds: () => void;
  setupReleaseFails: (params: { error: FsError }) => void;
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

  const deleteProxy = unlinkProxy();

  return {
    lockPath,

    setupReleaseSucceeds: (): void => {
      stagePathResolution();
      deleteProxy.succeeds({ path: lockPath });
    },

    setupReleaseFails: ({ error }: { error: FsError }): void => {
      stagePathResolution();
      deleteProxy.rejects({ path: lockPath, error });
    },

    getDeletedPaths: (): unknown[] =>
      deleteProxy.getCallsFor({ path: lockPath }).map((call) => call[0]),
  };
};
