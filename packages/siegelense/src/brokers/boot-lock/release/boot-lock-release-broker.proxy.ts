import { locationsBootLockPathFindBrokerProxy } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker.proxy';
import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { BootLockStub } from '../../../contracts/boot-lock/boot-lock.stub';
import type { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import type { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import type { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  FileContentsStub,
} from '@dungeonmaster/shared/contracts';

type InstanceId = ReturnType<typeof InstanceIdStub>;
type EpochMs = ReturnType<typeof EpochMsStub>;

const HOME_DIR = '/home/user';
const BOOT_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/boot.lock`;

export const bootLockReleaseBrokerProxy = (): {
  bootLockPath: ReturnType<typeof AbsoluteFilePathStub>;
  setupNoLock: () => void;
  setupLockHeldBy: (params: {
    heldBy: InstanceId;
    heldByPid: ReturnType<typeof ProcessIdStub>;
    acquiredAtMs: EpochMs;
  }) => void;
  setupLockReadFailsForNonAbsenceReason: () => void;
  getDeletedPaths: () => unknown[];
} => {
  const bootLockPath = AbsoluteFilePathStub({ value: BOOT_LOCK_VALUE });

  const pathProxy = locationsBootLockPathFindBrokerProxy();
  pathProxy.setupBootLockPath({
    homeDir: HOME_DIR,
    homePath: FilePathStub({ value: `${HOME_DIR}/.dungeonmaster` }),
    rootPath: FilePathStub({ value: `${HOME_DIR}/.dungeonmaster/siegelense` }),
    bootLockPath: FilePathStub({ value: BOOT_LOCK_VALUE }),
  });

  errorIsNativeErrorAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();

  return {
    bootLockPath,

    setupNoLock: (): void => {
      readProxy.rejects({
        filePath: bootLockPath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), {
          code: 'ENOENT',
        }),
      });
    },

    setupLockHeldBy: ({
      heldBy,
      heldByPid,
      acquiredAtMs,
    }: {
      heldBy: InstanceId;
      heldByPid: ReturnType<typeof ProcessIdStub>;
      acquiredAtMs: EpochMs;
    }): void => {
      const lock = BootLockStub({ heldBy, heldByPid, acquiredAtMs });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
      // Staged unconditionally: the "held by another instance" scenario never reaches this call,
      // and the "held by this instance" scenario needs it staged to succeed.
      unlinkProxy.succeeds({ filePath: bootLockPath });
    },

    // This instance is itself mid-boot — spinning up an API server, a Vite server, Chromium — so
    // EMFILE (file descriptor exhaustion) is the realistic non-absence code the read can fail
    // with. The lock may genuinely still be held by this instance; a read failure must not read
    // as "released" and skip the unlink.
    setupLockReadFailsForNonAbsenceReason: (): void => {
      readProxy.rejects({
        filePath: bootLockPath,
        error: Object.assign(new Error('EMFILE: too many open files'), { code: 'EMFILE' }),
      });
    },

    getDeletedPaths: (): unknown[] => unlinkProxy.getDeletedPaths(),
  };
};
