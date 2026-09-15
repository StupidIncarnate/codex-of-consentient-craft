import { readFile } from 'fs/promises';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { locationsRegistryLockPathFindBrokerProxy } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  FileContentsStub,
} from '@dungeonmaster/shared/contracts';

type EpochMs = ReturnType<typeof EpochMsStub>;

const HOME_DIR = '/home/user';
const REGISTRY_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/registry.lock`;

// A failed exclusive create is what every scenario but the plain-absent one stages FIRST — the
// broker always tries `wx` before it ever reads, so an EEXIST rejection is the trigger for the
// read-and-decide logic every other setup method below exercises.
const eexistError = (): Error =>
  Object.assign(new Error('EEXIST: file already exists'), { code: 'EEXIST' });

export const registryLockAcquireBrokerProxy = (): {
  lockPath: ReturnType<typeof AbsoluteFilePathStub>;
  setupNow: (params: { nowMs: EpochMs }) => void;
  setupAvailable: () => void;
  setupStaleHeldByAnother: (params: { nowMs: EpochMs }) => void;
  setupFreshHeldByAnotherPastCeiling: () => { startedAtMs: EpochMs; nowMs: EpochMs };
  getLastWriteFlag: () => unknown;
  getDeletedPaths: () => unknown[];
} => {
  const lockPath = AbsoluteFilePathStub({ value: REGISTRY_LOCK_VALUE });

  const pathProxy = locationsRegistryLockPathFindBrokerProxy();
  // pathJoinAdapterProxy's `returns()` is call-order-scoped and shared across every composed
  // proxy in a test, so this stages EXACTLY one path resolution per real invocation of
  // `locationsRegistryLockPathFindBroker()` the calling scenario will trigger — never upfront,
  // and never more than that real count, or a sibling proxy's own real call (registryReadBroker's,
  // registryWriteBroker's) consumes this proxy's leftover staged value instead of its own.
  const stagePathResolution = (): void => {
    pathProxy.setupRegistryLockPath({
      homeDir: HOME_DIR,
      homePath: FilePathStub({ value: `${HOME_DIR}/.dungeonmaster` }),
      rootPath: FilePathStub({ value: `${HOME_DIR}/.dungeonmaster/siegelense` }),
      registryLockPath: FilePathStub({ value: REGISTRY_LOCK_VALUE }),
    });
  };

  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();
  const readHandle: MockHandle = registerMock({ fn: readFile });
  const dateHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    lockPath,

    setupNow: ({ nowMs }: { nowMs: EpochMs }): void => {
      dateHandle.calledWith([]).returns(nowMs);
    },

    // One real invocation: the exclusive create wins immediately.
    setupAvailable: (): void => {
      stagePathResolution();
      writeProxy.succeeds({ filePath: lockPath });
    },

    // One real invocation: the exclusive create loses to a stale file, which this stages as
    // read-and-decide-stale, then unlink. The RETRY invocation (the re-create that takes the lock
    // over) is a separate real call — pair this with `setupAvailable()` for that second one.
    setupStaleHeldByAnother: ({ nowMs }: { nowMs: EpochMs }): void => {
      stagePathResolution();
      const acquiredAtMs = EpochMsStub({
        value:
          nowMs -
          instanceLifecycleStatics.registryLock.ttlMs -
          instanceLifecycleStatics.registryLock.pollMs,
      });
      writeProxy.throwsOnce({ filePath: lockPath, error: eexistError() });
      readProxy.resolves({
        filePath: lockPath,
        content: FileContentsStub({ value: String(acquiredAtMs) }),
      });
      unlinkProxy.succeeds({ filePath: lockPath });
    },

    // One real invocation: puts the caller's own elapsed wait (startedAtMs -> nowMs) exactly at
    // waitCeilingMs on the FIRST check, with the held lock's timestamp freshly recent relative to
    // that same nowMs — so the broker throws without ever reaching its sleep-and-recurse branch.
    setupFreshHeldByAnotherPastCeiling: (): { startedAtMs: EpochMs; nowMs: EpochMs } => {
      stagePathResolution();
      const startedAtMs = EpochMsStub();
      const { pollMs, waitCeilingMs } = instanceLifecycleStatics.registryLock;
      const nowMs = EpochMsStub({ value: startedAtMs + waitCeilingMs });
      const heldAcquiredAtMs = EpochMsStub({ value: nowMs - pollMs });

      // The exclusive create loses to this already-fresh file before the read ever runs.
      writeProxy.throws({ filePath: lockPath, error: eexistError() });

      readHandle
        .onceFor([lockPath])
        .resolves(FileContentsStub({ value: String(heldAcquiredAtMs) }));

      // call 1: startedAtMs (broker entry). call 2: nowMs, already at the wait ceiling.
      dateHandle.onceFor([]).returns(startedAtMs);
      dateHandle.onceFor([]).returns(nowMs);

      return { startedAtMs, nowMs };
    },

    getLastWriteFlag: (): unknown => writeProxy.getFlagFor({ filePath: lockPath }),

    getDeletedPaths: (): unknown[] => unlinkProxy.getDeletedPaths(),
  };
};
