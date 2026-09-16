import { readFile } from 'fs/promises';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle, SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { locationsBootLockPathFindBrokerProxy } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker.proxy';
import { locationsRootPathFindBrokerProxy } from '../../locations/root-path-find/locations-root-path-find-broker.proxy';
import { fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { BootLockStub } from '../../../contracts/boot-lock/boot-lock.stub';
import type { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { BootLockHeldError } from '../../../errors/boot-lock-held/boot-lock-held-error';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  FileContentsStub,
  ProcessIdStub,
} from '@dungeonmaster/shared/contracts';

type InstanceId = ReturnType<typeof InstanceIdStub>;
type EpochMs = ReturnType<typeof EpochMsStub>;

const HOME_DIR = '/home/user';
const HOME_PATH_VALUE = `${HOME_DIR}/.dungeonmaster`;
const ROOT_PATH_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense`;
const BOOT_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/boot.lock`;

// These stage a SAME-REALM `Error` deliberately, not the cross-realm shape a real `fs/promises`
// rejection actually has under Jest — see `registryLockAcquireBrokerProxy`'s identical comment for
// why (`@dungeonmaster/testing`'s own `mockStagingCreateTransformer` shares the same instanceof
// gap, so `.throws()`/`.rejects()` cannot relay a cross-realm error faithfully at this level).
// `errorIsNativeErrorAdapter`'s own test proves the realm-safety mechanism against a genuine
// `vm`-realm error; `driver-flow.integration.test.ts` proves it against the real failure mode.
//
// A failed exclusive create is what every scenario but the plain-absent one stages FIRST — the
// broker always tries `wx` before it ever reads, so an EEXIST rejection is the trigger for the
// read-and-decide logic every other setup method below exercises.
const eexistError = (): Error =>
  Object.assign(new Error('EEXIST: file already exists'), { code: 'EEXIST' });

// ENOENT on the read that follows a failed create is the one code the broker treats as absence —
// the holder released the file in the instant between the create and this read.
const enoentError = (): Error =>
  Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });

// This instance is itself mid-boot — spinning up an API server, a Vite server, Chromium — so
// EMFILE (file descriptor exhaustion) is the realistic non-absence code the read can fail with.
const emfileError = (): Error =>
  Object.assign(new Error('EMFILE: too many open files'), { code: 'EMFILE' });

// A real permission failure on the stale-lock unlink itself — never absence-shaped, so it must
// stay a real thrown error rather than being classified alongside a competitor's ENOENT.
const eaccesError = (): Error =>
  Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });

export const bootLockAcquireBrokerProxy = (): {
  bootLockPath: ReturnType<typeof AbsoluteFilePathStub>;
  rootPath: ReturnType<typeof FilePathStub>;
  setupNow: (params: { nowMs: EpochMs }) => void;
  setupLockHeldBy: (params: {
    heldBy: InstanceId;
    heldByPid: ReturnType<typeof ProcessIdStub>;
    acquiredAtMs: EpochMs;
  }) => void;
  setupStaleLockHeldBy: (params: { otherInstanceId: InstanceId; nowMs: EpochMs }) => void;
  setupStaleUnlinkLostRaceToAnotherContender: (params: {
    otherInstanceId: InstanceId;
    nowMs: EpochMs;
  }) => void;
  setupStaleUnlinkFailsForNonAbsenceReason: (params: {
    otherInstanceId: InstanceId;
    nowMs: EpochMs;
  }) => void;
  setupWriteSucceeds: () => void;
  setupFreshLockHeldByAnotherPastCeiling: (params: { otherInstanceId: InstanceId }) => {
    startedAtMs: EpochMs;
    expectedError: BootLockHeldError;
  };
  setupStaleTakeoverLosesRetryRace: (params: { otherInstanceId: InstanceId }) => {
    expectedError: BootLockHeldError;
  };
  setupLockReadFailsForNonAbsenceReason: () => void;
  setupLockVanishesBeforeRetryRead: () => void;
  getWrittenLock: () => unknown;
  getLastWriteFlag: () => unknown;
  getCreatedDirs: () => readonly unknown[];
} => {
  const bootLockPath = AbsoluteFilePathStub({ value: BOOT_LOCK_VALUE });
  const homePath = FilePathStub({ value: HOME_PATH_VALUE });
  const rootPath = FilePathStub({ value: ROOT_PATH_VALUE });

  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathProxy = locationsBootLockPathFindBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  // pathJoinAdapterProxy's `returns()` is call-order-scoped (one resolution per staging), so a
  // broker that resolves the path more than once per test needs this staged again for each
  // resolution it will trigger. Each real acquire attempt now resolves the root path TWICE —
  // once directly (for the mkdir the broker runs before its exclusive create) and once more
  // inside `locationsBootLockPathFindBroker`'s own internal composition — plus the bootLock join
  // itself, matching `registryLockAcquireBrokerProxy`'s identical double-root-resolution shape.
  // Four calls covers every scenario in this proxy's own test file with headroom.
  const stageBootLockPathResolution = (): void => {
    rootPathProxy.setupRootPath({ homeDir: HOME_DIR, homePath, rootPath });
    pathProxy.setupBootLockPath({
      homeDir: HOME_DIR,
      homePath,
      rootPath,
      bootLockPath: FilePathStub({ value: BOOT_LOCK_VALUE }),
    });
  };
  stageBootLockPathResolution();
  stageBootLockPathResolution();
  stageBootLockPathResolution();
  stageBootLockPathResolution();

  errorIsNativeErrorAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();
  const readHandle: MockHandle = registerMock({ fn: readFile });
  const dateHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    bootLockPath,
    rootPath,

    setupNow: ({ nowMs }: { nowMs: EpochMs }): void => {
      dateHandle.calledWith([]).returns(nowMs);
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
      // The exclusive create is tried before any read, so its failure (this instance's own file
      // already sits there) is what the idempotent-return branch reads to recognise its own lock.
      writeProxy.throws({ filePath: bootLockPath, error: eexistError() });
      const lock = BootLockStub({ heldBy, heldByPid, acquiredAtMs });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
    },

    setupStaleLockHeldBy: ({
      otherInstanceId,
      nowMs,
    }: {
      otherInstanceId: InstanceId;
      nowMs: EpochMs;
    }): void => {
      const acquiredAtMs = EpochMsStub({
        value:
          nowMs -
          instanceLifecycleStatics.bootLock.ttlMs -
          instanceLifecycleStatics.bootLock.pollMs,
      });
      const lock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: ProcessIdStub(),
        acquiredAtMs,
      });
      // FIRST exclusive create fails (the stale file is there) → read → stale → unlink → the
      // RETRY exclusive create (also staged below via setupWriteSucceeds) takes it over.
      writeProxy.throwsOnce({ filePath: bootLockPath, error: eexistError() });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
      unlinkProxy.succeeds({ filePath: bootLockPath });
    },

    // Two contenders agree the lock is stale; this one loses the race to remove it — its unlink
    // finds nothing there. Pair with `setupWriteSucceeds()` for the RETRY create the ENOENT should
    // still reach, exactly as `setupStaleLockHeldBy` pairs with it.
    setupStaleUnlinkLostRaceToAnotherContender: ({
      otherInstanceId,
      nowMs,
    }: {
      otherInstanceId: InstanceId;
      nowMs: EpochMs;
    }): void => {
      const acquiredAtMs = EpochMsStub({
        value:
          nowMs -
          instanceLifecycleStatics.bootLock.ttlMs -
          instanceLifecycleStatics.bootLock.pollMs,
      });
      const lock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: ProcessIdStub(),
        acquiredAtMs,
      });
      writeProxy.throwsOnce({ filePath: bootLockPath, error: eexistError() });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
      unlinkProxy.throws({ filePath: bootLockPath, error: enoentError() });
    },

    // The stale-lock unlink fails for a reason that has nothing to do with a competitor's cleanup
    // — EACCES, not ENOENT — so it must still throw rather than being classified as a benign race.
    setupStaleUnlinkFailsForNonAbsenceReason: ({
      otherInstanceId,
      nowMs,
    }: {
      otherInstanceId: InstanceId;
      nowMs: EpochMs;
    }): void => {
      const acquiredAtMs = EpochMsStub({
        value:
          nowMs -
          instanceLifecycleStatics.bootLock.ttlMs -
          instanceLifecycleStatics.bootLock.pollMs,
      });
      const lock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: ProcessIdStub(),
        acquiredAtMs,
      });
      writeProxy.throwsOnce({ filePath: bootLockPath, error: eexistError() });
      readProxy.resolves({
        filePath: bootLockPath,
        content: FileContentsStub({ value: JSON.stringify(lock) }),
      });
      unlinkProxy.throws({ filePath: bootLockPath, error: eaccesError() });
    },

    setupWriteSucceeds: (): void => {
      writeProxy.succeeds({ filePath: bootLockPath });
    },

    // The read that classifies a failed exclusive create fails for a reason that has nothing to
    // do with absence — EMFILE, not ENOENT. Persistent (not one-shot): the broker must throw on
    // the FIRST occurrence rather than retrying, so a regression that goes back to swallowing
    // this into "absent" keeps failing the same way on every subsequent attempt too.
    setupLockReadFailsForNonAbsenceReason: (): void => {
      writeProxy.throws({ filePath: bootLockPath, error: eexistError() });
      readProxy.rejects({ filePath: bootLockPath, error: emfileError() });
    },

    // FIRST exclusive create fails (a competitor's file was there) → the read that classifies it
    // finds nothing (ENOENT) — its holder released it in between → RETRY exclusive create
    // (staged to succeed via setupWriteSucceeds) takes the now-genuinely-absent path.
    setupLockVanishesBeforeRetryRead: (): void => {
      writeProxy.throwsOnce({ filePath: bootLockPath, error: eexistError() });
      readProxy.rejects({ filePath: bootLockPath, error: enoentError() });
    },

    // Puts the caller's own elapsed wait (startedAtMs -> nowMs) exactly at waitCeilingMs on the
    // FIRST check, with the held lock's acquiredAtMs freshly recent relative to that same nowMs —
    // so the broker throws without ever reaching its sleep-and-recurse branch, and this scenario
    // needs no real poll wait to prove the ceiling fires.
    setupFreshLockHeldByAnotherPastCeiling: ({
      otherInstanceId,
    }: {
      otherInstanceId: InstanceId;
    }): { startedAtMs: EpochMs; expectedError: BootLockHeldError } => {
      const startedAtMs = EpochMsStub();
      const { pollMs, waitCeilingMs } = instanceLifecycleStatics.bootLock;
      const nowMs = EpochMsStub({ value: startedAtMs + waitCeilingMs });

      const lock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: ProcessIdStub(),
        acquiredAtMs: EpochMsStub({ value: nowMs - pollMs }),
      });

      // The exclusive create loses to this already-fresh file before the read ever runs.
      writeProxy.throws({ filePath: bootLockPath, error: eexistError() });

      readHandle
        .onceFor([bootLockPath])
        .resolves(FileContentsStub({ value: JSON.stringify(lock) }));

      // call 1: startedAtMs (broker entry). call 2: nowMs, already at the wait ceiling.
      dateHandle.onceFor([]).returns(startedAtMs);
      dateHandle.onceFor([]).returns(nowMs);

      return {
        startedAtMs,
        expectedError: new BootLockHeldError({ heldBy: otherInstanceId, waitedMs: waitCeilingMs }),
      };
    },

    // A stale takeover that loses its own re-create: the FIRST exclusive create fails against a
    // STALE file, the read sees it as stale and this call removes it, but the RETRY exclusive
    // create also fails — a competitor recreated the file first — and the second read finds that
    // competitor's lock FRESH. Both nowMs values are driven far enough past startedAtMs to put the
    // second read's freshness AND the wait ceiling in the same instant, so the broker throws
    // immediately rather than sleeping through a real poll.
    setupStaleTakeoverLosesRetryRace: ({
      otherInstanceId,
    }: {
      otherInstanceId: InstanceId;
    }): { expectedError: BootLockHeldError } => {
      const startedAtMs = EpochMsStub();
      const { ttlMs, pollMs, waitCeilingMs } = instanceLifecycleStatics.bootLock;
      const nowMsFirstAttempt = startedAtMs;
      const nowMsSecondAttempt = EpochMsStub({ value: startedAtMs + waitCeilingMs });

      const staleLock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: ProcessIdStub(),
        acquiredAtMs: EpochMsStub({ value: nowMsFirstAttempt - ttlMs - pollMs }),
      });
      const freshLock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: ProcessIdStub(),
        acquiredAtMs: EpochMsStub({ value: nowMsSecondAttempt - pollMs }),
      });

      // Every exclusive create this test drives loses — the first to the stale file, the retry to
      // the competitor that beat this call back to the path.
      writeProxy.throws({ filePath: bootLockPath, error: eexistError() });
      unlinkProxy.succeeds({ filePath: bootLockPath });

      readHandle
        .onceFor([bootLockPath])
        .resolves(FileContentsStub({ value: JSON.stringify(staleLock) }));
      readHandle
        .onceFor([bootLockPath])
        .resolves(FileContentsStub({ value: JSON.stringify(freshLock) }));

      // call 1: startedAtMs (broker entry). call 2: nowMs for the first (failed) attempt. call 3:
      // nowMs for the retry, already at the wait ceiling.
      dateHandle.onceFor([]).returns(startedAtMs);
      dateHandle.onceFor([]).returns(nowMsFirstAttempt);
      dateHandle.onceFor([]).returns(nowMsSecondAttempt);

      return {
        expectedError: new BootLockHeldError({
          heldBy: otherInstanceId,
          waitedMs: nowMsSecondAttempt - startedAtMs,
        }),
      };
    },

    getWrittenLock: (): unknown => {
      const written = writeProxy.getWrittenFor({ filePath: bootLockPath });
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },

    getLastWriteFlag: (): unknown => writeProxy.getFlagFor({ filePath: bootLockPath }),

    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
  };
};
