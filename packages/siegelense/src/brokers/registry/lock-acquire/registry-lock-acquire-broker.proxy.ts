import { readFile } from 'fs/promises';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { locationsRegistryLockPathFindBrokerProxy } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker.proxy';
import { locationsRootPathFindBrokerProxy } from '../../locations/root-path-find/locations-root-path-find-broker.proxy';
import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
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
const HOME_PATH_VALUE = `${HOME_DIR}/.dungeonmaster`;
const ROOT_PATH_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense`;
const REGISTRY_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/registry.lock`;

// These stage a SAME-REALM `Error` deliberately, not the cross-realm shape a real `fs/promises`
// rejection actually has under Jest (Node's own internals construct that error outside the vm
// context a test file runs inside, which is what made `registryLockAcquireBroker`'s own
// `instanceof Error` check reject a genuine EEXIST — see `errorIsNativeErrorAdapter` and its own
// test, which reproduces that exact shape via `vm.runInNewContext`). A cross-realm error cannot be
// staged faithfully at THIS level: `@dungeonmaster/testing`'s `mockStagingCreateTransformer` (the
// shared `rejects`/`throws` implementation every `registerMock` proxy in this repo shares) itself
// does `val instanceof Error ? val : new Error(String(val))` — the identical bug, one level up —
// so a cross-realm error handed to `.rejects()`/`.throws()` here is silently rebuilt into a
// same-realm one with its `code` dropped before this broker ever sees it. These tests stay honest
// about what they prove at this level: the broker's CLASSIFICATION LOGIC on an Error-shaped,
// `code`-carrying object. The realm-safety MECHANISM is proven by `errorIsNativeErrorAdapter`'s own
// test, and the real, cross-process failure mode by `driver-flow.integration.test.ts`.
const eexistError = (): Error =>
  Object.assign(new Error('EEXIST: file already exists'), { code: 'EEXIST' });

// ENOENT on the read that follows a failed create is the one code the broker treats as absence —
// the holder released the file in the instant between the create and this read.
const enoentError = (): Error =>
  Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });

// An instance mid-spin-up of an API server, a Vite server and Chromium is exactly what starves
// file descriptors, so EMFILE is the realistic non-absence code the read can fail with.
const emfileError = (): Error =>
  Object.assign(new Error('EMFILE: too many open files'), { code: 'EMFILE' });

// A real permission failure on the stale-lock unlink itself — never absence-shaped, so it must
// stay a real thrown error rather than being classified alongside a competitor's ENOENT.
const eaccesError = (): Error =>
  Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });

export const registryLockAcquireBrokerProxy = (): {
  lockPath: ReturnType<typeof AbsoluteFilePathStub>;
  rootPath: ReturnType<typeof FilePathStub>;
  setupNow: (params: { nowMs: EpochMs }) => void;
  setupAvailable: () => void;
  setupStaleHeldByAnother: (params: { nowMs: EpochMs }) => void;
  setupStaleUnlinkLostRaceToAnotherContender: (params: { nowMs: EpochMs }) => void;
  setupStaleUnlinkFailsForNonAbsenceReason: (params: { nowMs: EpochMs }) => void;
  setupFreshHeldByAnotherPastCeiling: () => { startedAtMs: EpochMs; nowMs: EpochMs };
  setupLockReadFailsForNonAbsenceReason: () => void;
  setupLockVanishesBeforeRetryRead: () => void;
  getLastWriteFlag: () => unknown;
  getDeletedPaths: () => unknown[];
  getCreatedDirs: () => readonly unknown[];
} => {
  const lockPath = AbsoluteFilePathStub({ value: REGISTRY_LOCK_VALUE });
  const rootPath = FilePathStub({ value: ROOT_PATH_VALUE });
  const homePath = FilePathStub({ value: HOME_PATH_VALUE });

  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathProxy = locationsRegistryLockPathFindBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  // pathJoinAdapterProxy's `returns()` is call-order-scoped and shared across every composed
  // proxy in a test, so this stages EXACTLY one path resolution per real invocation of a
  // locations broker the calling scenario will trigger — never upfront, and never more than that
  // real count. `registryLockAcquireBroker` calls `locationsRootPathFindBroker()` directly (for
  // the mkdir), THEN `locationsRegistryLockPathFindBroker()` (which recomputes the root path
  // internally on its way to the lock path) — so the root-path resolution is staged TWICE, in
  // that order, matching `registryWriteBrokerProxy`'s identical double-resolution shape.
  const stagePathResolution = (): void => {
    rootPathProxy.setupRootPath({ homeDir: HOME_DIR, homePath, rootPath });
    pathProxy.setupRegistryLockPath({
      homeDir: HOME_DIR,
      homePath,
      rootPath,
      registryLockPath: FilePathStub({ value: REGISTRY_LOCK_VALUE }),
    });
  };

  errorIsNativeErrorAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();
  const readHandle: MockHandle = registerMock({ fn: readFile });
  const dateHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    lockPath,
    rootPath,

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

    // Two contenders agree the lock is stale; this one loses the race to remove it — its unlink
    // finds nothing there. Pair with `setupAvailable()` for the RETRY create the ENOENT should
    // still reach, exactly as `setupStaleHeldByAnother` pairs with it.
    setupStaleUnlinkLostRaceToAnotherContender: ({ nowMs }: { nowMs: EpochMs }): void => {
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
      unlinkProxy.throws({ filePath: lockPath, error: enoentError() });
    },

    // The stale-lock unlink fails for a reason that has nothing to do with a competitor's cleanup
    // — EACCES, not ENOENT — so it must still throw rather than being classified as a benign race.
    setupStaleUnlinkFailsForNonAbsenceReason: ({ nowMs }: { nowMs: EpochMs }): void => {
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
      unlinkProxy.throws({ filePath: lockPath, error: eaccesError() });
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

    // The read that classifies a failed exclusive create fails for a reason that has nothing to
    // do with absence — EMFILE, not ENOENT. Persistent (not one-shot): the broker must throw on
    // the FIRST occurrence rather than recursing, so a regression that goes back to swallowing
    // this into "absent" keeps failing the same way on every subsequent attempt too.
    setupLockReadFailsForNonAbsenceReason: (): void => {
      stagePathResolution();
      writeProxy.throws({ filePath: lockPath, error: eexistError() });
      readProxy.rejects({ filePath: lockPath, error: emfileError() });
    },

    // FIRST exclusive create fails (a competitor's file was there) → the read that classifies it
    // finds nothing (ENOENT) — its holder released it in between → RETRY exclusive create
    // (staged separately via setupAvailable) takes the now-genuinely-absent path.
    setupLockVanishesBeforeRetryRead: (): void => {
      stagePathResolution();
      writeProxy.throwsOnce({ filePath: lockPath, error: eexistError() });
      readProxy.rejects({ filePath: lockPath, error: enoentError() });
    },

    getLastWriteFlag: (): unknown => writeProxy.getFlagFor({ filePath: lockPath }),

    getDeletedPaths: (): unknown[] => unlinkProxy.getDeletedPaths(),

    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
  };
};
