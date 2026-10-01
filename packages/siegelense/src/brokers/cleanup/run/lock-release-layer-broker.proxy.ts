import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import type { FsError } from '#gateway/node/fs';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';
import { BootLockStub } from '../../../contracts/boot-lock/boot-lock.stub';
import { locationsBootLockPathFindBrokerProxy } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker.proxy';
import { locationsRegistryLockPathFindBrokerProxy } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker.proxy';

type EpochMs = number;

const HOME_DIR = '/home/user';
const HOME_PATH_VALUE = `${HOME_DIR}/.dungeonmaster`;
const HOME_PATH = HOME_PATH_VALUE;
const BOOT_LOCK_VALUE = `${HOME_PATH_VALUE}/siegelense/boot.lock`;
const REGISTRY_LOCK_VALUE = `${HOME_PATH_VALUE}/siegelense/registry.lock`;

export const lockReleaseLayerBrokerProxy = (): {
  bootLockPath: string;
  registryLockPath: string;
  setupNoLocks: () => void;
  setupBootLockFresh: (params: { acquiredAtMs: EpochMs }) => void;
  setupBootLockStale: (params: { acquiredAtMs: EpochMs }) => void;
  setupBootLockUnlinkFails: (params: { acquiredAtMs: EpochMs }) => void;
  setupBootLockReadFailsForNonAbsenceReason: () => void;
  setupRegistryLockFresh: (params: { acquiredAtMs: EpochMs }) => void;
  setupRegistryLockStale: (params: { acquiredAtMs: EpochMs }) => void;
  setupRegistryLockUnlinkFails: (params: { acquiredAtMs: EpochMs }) => void;
  getDeletedPaths: () => unknown[];
} => {
  const bootLockPath = BOOT_LOCK_VALUE;
  const registryLockPath = REGISTRY_LOCK_VALUE;

  // setupHomeOnly (not setupBootLockPath/setupRegistryLockPath): this proxy is composed alongside
  // instanceKillBrokerProxy in cleanup-run-broker.proxy.ts, and both need the SAME addressed home
  // stage, without ALSO staging a bootLockPath/registryLockPath this proxy computes off its OWN
  // real reads instead. enforce-proxy-child-creation forbids reaching past this DIRECT child
  // straight to dungeonmasterHomeFindBrokerProxy, since lock-release-layer-broker.ts never imports
  // it directly.
  const pathProxy = locationsBootLockPathFindBrokerProxy();
  locationsRegistryLockPathFindBrokerProxy();

  const readProxy = readFileIfExistsProxy();
  const deleteProxy = unlinkProxy();

  return {
    bootLockPath,
    registryLockPath,

    setupNoLocks: (): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.missing({ path: bootLockPath });
      readProxy.missing({ path: registryLockPath });
    },

    setupBootLockFresh: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      const lock = BootLockStub({ acquiredAtMs });
      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });
      readProxy.missing({ path: registryLockPath });
    },

    setupBootLockStale: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      const lock = BootLockStub({ acquiredAtMs });
      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });
      deleteProxy.succeeds({ path: bootLockPath });
      readProxy.missing({ path: registryLockPath });
    },

    setupBootLockUnlinkFails: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      const lock = BootLockStub({ acquiredAtMs });
      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });
      deleteProxy.rejects({
        path: bootLockPath,
        error: FsErrorStub({ code: 'EPERM', syscall: 'unlink', path: bootLockPath }),
      });
      readProxy.missing({ path: registryLockPath });
    },

    setupBootLockReadFailsForNonAbsenceReason: (): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.throwsMatchingPath({
        path: bootLockPath,
        error: Object.assign(new Error('EMFILE: too many open files'), {
          code: 'EMFILE',
        }) as FsError,
      });
    },

    setupRegistryLockFresh: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.missing({ path: bootLockPath });
      readProxy.returns({
        path: registryLockPath,
        contents: String(acquiredAtMs),
      });
    },

    setupRegistryLockStale: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.missing({ path: bootLockPath });
      readProxy.returns({
        path: registryLockPath,
        contents: String(acquiredAtMs),
      });
      deleteProxy.succeeds({ path: registryLockPath });
    },

    setupRegistryLockUnlinkFails: ({ acquiredAtMs }: { acquiredAtMs: EpochMs }): void => {
      pathProxy.setupHomeOnly({ homeDir: HOME_DIR, homePath: HOME_PATH });
      readProxy.missing({ path: bootLockPath });
      readProxy.returns({
        path: registryLockPath,
        contents: String(acquiredAtMs),
      });
      deleteProxy.rejects({
        path: registryLockPath,
        error: FsErrorStub({ code: 'EPERM', syscall: 'unlink', path: registryLockPath }),
      });
    },

    getDeletedPaths: (): unknown[] =>
      deleteProxy
        .getCallsFor({
          path: (value: unknown): boolean => value === bootLockPath || value === registryLockPath,
        })
        .map((call) => call[0]),
  };
};
