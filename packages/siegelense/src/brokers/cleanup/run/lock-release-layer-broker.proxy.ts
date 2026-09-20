import { homedir } from 'os';
import { AbsoluteFilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { BootLockStub } from '../../../contracts/boot-lock/boot-lock.stub';
import type { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { locationsBootLockPathFindBrokerProxy } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker.proxy';
import { locationsRegistryLockPathFindBrokerProxy } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker.proxy';

type EpochMs = ReturnType<typeof EpochMsStub>;

const HOME_DIR = '/home/user';
const BOOT_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/boot.lock`;
const REGISTRY_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/registry.lock`;

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

  // Composed bare, satisfying enforce-proxy-child-creation, rather than through their own
  // setupBootLockPath/setupRegistryLockPath one-shots: this proxy is composed alongside
  // instanceKillBrokerProxy in cleanup-run-broker.proxy.ts, and BOTH ultimately mock the same raw
  // os.homedir() and path.join — a one-shot staged here for "the next pathJoin call" is consumed
  // by whichever real call happens to land next across the WHOLE composed test, not necessarily
  // this broker's own. Real passthrough (path.join's own sticky default) plus the STICKY homedir
  // registration below compute the identical literal paths either way, without that risk.
  locationsBootLockPathFindBrokerProxy();
  locationsRegistryLockPathFindBrokerProxy();

  errorIsNativeErrorAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();
  // Sticky (calledWith, not onceFor) so it answers every call regardless of how many real
  // invocations happen before this broker's own — matching instanceKillBrokerProxy's identical
  // convention for the same underlying function.
  registerMock({ fn: homedir }).calledWith([]).returns(HOME_DIR);

  const clearHomeEnv = (): void => {
    Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
  };

  return {
    bootLockPath,
    registryLockPath,

    setupNoLocks: (): void => {
      clearHomeEnv();
      readProxy.rejects({ filePath: bootLockPath, error: enoentError() });
      readProxy.rejects({ filePath: registryLockPath, error: enoentError() });
    },

    setupBootLockFresh: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      clearHomeEnv();
      const lock = BootLockStub({ acquiredAtMs });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
      readProxy.rejects({ filePath: registryLockPath, error: enoentError() });
    },

    setupBootLockStale: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      clearHomeEnv();
      const lock = BootLockStub({ acquiredAtMs });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
      unlinkProxy.succeeds({ filePath: bootLockPath });
      readProxy.rejects({ filePath: registryLockPath, error: enoentError() });
    },

    setupBootLockReadFailsForNonAbsenceReason: (): void => {
      clearHomeEnv();
      readProxy.rejects({
        filePath: bootLockPath,
        error: Object.assign(new Error('EMFILE: too many open files'), { code: 'EMFILE' }),
      });
    },

    setupRegistryLockFresh: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      clearHomeEnv();
      readProxy.rejects({ filePath: bootLockPath, error: enoentError() });
      readProxy.resolves({
        filePath: registryLockPath,
        content: FileContentsStub({ value: String(acquiredAtMs) }),
      });
    },

    setupRegistryLockStale: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      clearHomeEnv();
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
