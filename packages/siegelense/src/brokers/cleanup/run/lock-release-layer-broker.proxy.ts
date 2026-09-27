import {
  AbsoluteFilePathStub,
  FileContentsStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { BootLockStub } from '../../../contracts/boot-lock/boot-lock.stub';
import type { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { locationsBootLockPathFindBrokerProxy } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker.proxy';
import { locationsRegistryLockPathFindBrokerProxy } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker.proxy';

type EpochMs = ReturnType<typeof EpochMsStub>;

const HOME_DIR = '/home/user';
const HOME_PATH_VALUE = `${HOME_DIR}/.dungeonmaster`;
const HOME_PATH = FilePathStub({ value: HOME_PATH_VALUE });
const BOOT_LOCK_VALUE = `${HOME_PATH_VALUE}/siegelense/boot.lock`;
const REGISTRY_LOCK_VALUE = `${HOME_PATH_VALUE}/siegelense/registry.lock`;

const enoentError = (): Error =>
  Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });

export const lockReleaseLayerBrokerProxy = (): {
  bootLockPath: ReturnType<typeof AbsoluteFilePathStub>;
  registryLockPath: ReturnType<typeof AbsoluteFilePathStub>;
  setupNoLocks: () => void;
  setupBootLockFresh: (params: { acquiredAtMs: EpochMs }) => void;
  setupBootLockStale: (params: { acquiredAtMs: EpochMs }) => void;
  setupBootLockReadFailsForNonAbsenceReason: () => void;
  setupRegistryLockFresh: (params: { acquiredAtMs: EpochMs }) => void;
  setupRegistryLockStale: (params: { acquiredAtMs: EpochMs }) => void;
  getDeletedPaths: () => unknown[];
} => {
  const bootLockPath = AbsoluteFilePathStub({ value: BOOT_LOCK_VALUE });
  const registryLockPath = AbsoluteFilePathStub({ value: REGISTRY_LOCK_VALUE });

  // setupHomeOnly (not setupBootLockPath/setupRegistryLockPath): this proxy is composed alongside
  // instanceKillBrokerProxy in cleanup-run-broker.proxy.ts, and both need the SAME addressed home
  // stage. setupBootLockPath/setupRegistryLockPath each ALSO queue a one-shot outer join, which a
  // sibling resolver's own unrelated real path.join call would silently consume instead — see
  // locationsRootPathFindBrokerProxy's own header comment on setupHomeOnly for why.
  const pathProxy = locationsBootLockPathFindBrokerProxy();
  locationsRegistryLockPathFindBrokerProxy();

  errorIsNativeErrorAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();

  return {
    bootLockPath,
    registryLockPath,

    setupNoLocks: (): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.rejects({ filePath: bootLockPath, error: enoentError() });
      readProxy.rejects({ filePath: registryLockPath, error: enoentError() });
    },

    setupBootLockFresh: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      const lock = BootLockStub({ acquiredAtMs });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
      readProxy.rejects({ filePath: registryLockPath, error: enoentError() });
    },

    setupBootLockStale: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      const lock = BootLockStub({ acquiredAtMs });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
      unlinkProxy.succeeds({ filePath: bootLockPath });
      readProxy.rejects({ filePath: registryLockPath, error: enoentError() });
    },

    setupBootLockReadFailsForNonAbsenceReason: (): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.rejects({
        filePath: bootLockPath,
        error: Object.assign(new Error('EMFILE: too many open files'), { code: 'EMFILE' }),
      });
    },

    setupRegistryLockFresh: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.rejects({ filePath: bootLockPath, error: enoentError() });
      readProxy.resolves({
        filePath: registryLockPath,
        content: FileContentsStub({ value: String(acquiredAtMs) }),
      });
    },

    setupRegistryLockStale: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.rejects({ filePath: bootLockPath, error: enoentError() });
      readProxy.resolves({
        filePath: registryLockPath,
        content: FileContentsStub({ value: String(acquiredAtMs) }),
      });
      unlinkProxy.succeeds({ filePath: registryLockPath });
    },

    getDeletedPaths: (): unknown[] => unlinkProxy.getDeletedPaths(),
  };
};
