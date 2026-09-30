import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import type { FsError } from '#gateway/node/fs';
import { locationsBootLockPathFindBrokerProxy } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker.proxy';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';
import { BootLockStub } from '../../../contracts/boot-lock/boot-lock.stub';
import type { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';

type InstanceId = ReturnType<typeof InstanceIdStub>;
type EpochMs = number;

const HOME_DIR = '/home/user';
const BOOT_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/boot.lock`;

export const bootLockReleaseBrokerProxy = (): {
  bootLockPath: string;
  setupNoLock: () => void;
  setupLockHeldBy: (params: {
    heldBy: InstanceId;
    heldByPid: string;
    acquiredAtMs: EpochMs;
  }) => void;
  setupLockReadFailsForNonAbsenceReason: () => void;
  getDeletedPaths: () => unknown[];
} => {
  const bootLockPath = BOOT_LOCK_VALUE;

  const pathProxy = locationsBootLockPathFindBrokerProxy();
  pathProxy.setupBootLockPath({
    homeDir: HOME_DIR,
    homePath: `${HOME_DIR}/.dungeonmaster`,
    rootPath: `${HOME_DIR}/.dungeonmaster/siegelense`,
    bootLockPath: BOOT_LOCK_VALUE,
  });

  const readProxy = readFileIfExistsProxy();
  const deleteProxy = unlinkProxy();

  return {
    bootLockPath,

    setupNoLock: (): void => {
      readProxy.missing({
        path: bootLockPath,
      });
    },

    setupLockHeldBy: ({
      heldBy,
      heldByPid,
      acquiredAtMs,
    }: {
      heldBy: InstanceId;
      heldByPid: string;
      acquiredAtMs: EpochMs;
    }): void => {
      const lock = BootLockStub({ heldBy, heldByPid, acquiredAtMs });
      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });
      // Staged unconditionally: the "held by another instance" scenario never reaches this call,
      // and the "held by this instance" scenario needs it staged to succeed.
      deleteProxy.succeeds({ path: bootLockPath });
    },

    // This instance is itself mid-boot — spinning up an API server, a Vite server, Chromium — so
    // EMFILE (file descriptor exhaustion) is the realistic non-absence code the read can fail
    // with. The lock may genuinely still be held by this instance; a read failure must not read
    // as "released" and skip the unlink.
    setupLockReadFailsForNonAbsenceReason: (): void => {
      readProxy.throwsMatchingPath({
        path: bootLockPath,
        error: Object.assign(new Error('EMFILE: too many open files'), {
          code: 'EMFILE',
        }) as FsError,
      });
    },

    getDeletedPaths: (): unknown[] =>
      deleteProxy.getCallsFor({ path: bootLockPath }).map((call) => call[0]),
  };
};
