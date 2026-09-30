import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { getPidProxy } from '#gateway/node/process/get-pid/get-pid.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import { FileExistsRecordedErrorStub } from '#gateway/node/fs/file-exists-recorded-error/file-exists-recorded-error.stub';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { unlinkIfExistsProxy } from '#gateway/node/fs__promises/unlink-if-exists/unlink-if-exists.proxy';
import { writeFileExclusiveProxy } from '#gateway/node/fs__promises/write-file-exclusive/write-file-exclusive.proxy';

import { BootLockStub } from '../../../contracts/boot-lock/boot-lock.stub';
import type { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { BootLockHeldError } from '../../../errors/boot-lock-held/boot-lock-held-error';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { locationsBootLockPathFindBrokerProxy } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker.proxy';
import { locationsRootPathFindBrokerProxy } from '../../locations/root-path-find/locations-root-path-find-broker.proxy';

type InstanceId = ReturnType<typeof InstanceIdStub>;
type EpochMs = number;

const HOME_DIR = '/home/user';
const HOME_PATH_VALUE = `${HOME_DIR}/.dungeonmaster`;
const ROOT_PATH_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense`;
const BOOT_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/boot.lock`;

// A failed exclusive create is what every scenario but the plain-absent one stages FIRST — the
// broker always tries `wx` before it ever reads, so the recorded EEXIST is the trigger for the
// read-and-decide logic every other setup method below exercises. Every failure staged here is a
// gateway stub addressed by this file's own boot.lock path: the recorded EEXIST for the create, and
// `FsErrorStub` for the read and unlink codes (EMFILE, EACCES) no recorded stub covers.
export const bootLockAcquireBrokerProxy = (): {
  bootLockPath: string;
  rootPath: string;
  setupNow: (params: { nowMs: EpochMs }) => void;
  setupPid: (params: { pid: number }) => void;
  setupLockHeldBy: (params: {
    heldBy: InstanceId;
    heldByPid: string;
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
  getLastWriteOptions: () => unknown;
  getCreatedDirs: () => readonly unknown[];
} => {
  const bootLockPath = BOOT_LOCK_VALUE;
  const homePath = HOME_PATH_VALUE;
  const rootPath = ROOT_PATH_VALUE;

  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathProxy = locationsBootLockPathFindBrokerProxy();
  const mkdirProxy = ensureDirProxy();
  // The retry poll's delay keeps its real timer; composed for enforce-proxy-child-creation.
  setTimeoutProxy();
  // rootPath is fixed for every test in this file (never runtime-computed here), so the one path
  // this broker ever ensureDirs is staged once, unconditionally, rather than per scenario.
  mkdirProxy.succeeds({ path: rootPath });
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
      bootLockPath: BOOT_LOCK_VALUE,
    });
  };
  stageBootLockPathResolution();
  stageBootLockPathResolution();
  stageBootLockPathResolution();
  stageBootLockPathResolution();

  isFsErrorProxy();
  const readProxy = readFileIfExistsProxy();
  const writeProxy = writeFileExclusiveProxy();
  const unlinkProxy = unlinkIfExistsProxy();
  const eexistError = FileExistsRecordedErrorStub({ path: BOOT_LOCK_VALUE });
  const clockProxy = nowProxy();
  const pidStager = getPidProxy();

  return {
    bootLockPath,
    rootPath,

    setupNow: ({ nowMs }: { nowMs: EpochMs }): void => {
      clockProxy.setupNow({ ms: nowMs });
    },

    setupPid: ({ pid }: { pid: number }): void => {
      pidStager.setupPid({ pid });
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
      // The exclusive create is tried before any read, so its failure (this instance's own file
      // already sits there) is what the idempotent-return branch reads to recognise its own lock.
      writeProxy.rejects({ path: bootLockPath, error: eexistError });
      const lock = BootLockStub({ heldBy, heldByPid, acquiredAtMs });
      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });
    },

    setupStaleLockHeldBy: ({
      otherInstanceId,
      nowMs,
    }: {
      otherInstanceId: InstanceId;
      nowMs: EpochMs;
    }): void => {
      const acquiredAtMs = (nowMs -
          instanceLifecycleStatics.bootLock.ttlMs -
          instanceLifecycleStatics.bootLock.pollMs);
      const lock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs,
      });
      // FIRST exclusive create fails (the stale file is there) → read → stale → unlink → the
      // RETRY exclusive create (also staged below via setupWriteSucceeds) takes it over.
      writeProxy.rejectsOnce({ path: bootLockPath, error: eexistError });
      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });
      unlinkProxy.succeeds({ path: bootLockPath });
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
      const acquiredAtMs = (nowMs -
          instanceLifecycleStatics.bootLock.ttlMs -
          instanceLifecycleStatics.bootLock.pollMs);
      const lock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs,
      });
      writeProxy.rejectsOnce({ path: bootLockPath, error: eexistError });
      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });
      unlinkProxy.missing({ path: bootLockPath });
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
      const acquiredAtMs = (nowMs -
          instanceLifecycleStatics.bootLock.ttlMs -
          instanceLifecycleStatics.bootLock.pollMs);
      const lock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs,
      });
      writeProxy.rejectsOnce({ path: bootLockPath, error: eexistError });
      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });
      unlinkProxy.rejects({
        path: bootLockPath,
        error: FsErrorStub({ code: 'EACCES', path: BOOT_LOCK_VALUE, syscall: 'unlink' }),
      });
    },

    setupWriteSucceeds: (): void => {
      writeProxy.succeeds({ path: bootLockPath });
    },

    // The read that classifies a failed exclusive create fails for a reason that has nothing to
    // do with absence — EMFILE, not ENOENT. Persistent (not one-shot): the broker must throw on
    // the FIRST occurrence rather than retrying, so a regression that goes back to swallowing
    // this into "absent" keeps failing the same way on every subsequent attempt too.
    setupLockReadFailsForNonAbsenceReason: (): void => {
      writeProxy.rejects({ path: bootLockPath, error: eexistError });
      readProxy.throwsMatchingPath({
        path: bootLockPath,
        error: FsErrorStub({ code: 'EMFILE', path: BOOT_LOCK_VALUE, syscall: 'open' }),
      });
    },

    // FIRST exclusive create fails (a competitor's file was there) → the read that classifies it
    // finds nothing (ENOENT) — its holder released it in between → RETRY exclusive create
    // (staged to succeed via setupWriteSucceeds) takes the now-genuinely-absent path.
    setupLockVanishesBeforeRetryRead: (): void => {
      writeProxy.rejectsOnce({ path: bootLockPath, error: eexistError });
      readProxy.missing({ path: bootLockPath });
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
      const startedAtMs = 1;
      const { pollMs, waitCeilingMs } = instanceLifecycleStatics.bootLock;
      const nowMs = (startedAtMs + waitCeilingMs);

      const lock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: (nowMs - pollMs),
      });

      // The exclusive create loses to this already-fresh file before the read ever runs.
      writeProxy.rejects({ path: bootLockPath, error: eexistError });

      readProxy.returns({
        path: bootLockPath,
        contents: JSON.stringify(lock),
      });

      // call 1: startedAtMs (broker entry). call 2: nowMs, already at the wait ceiling.
      clockProxy.setupNowOnce({ ms: startedAtMs });
      clockProxy.setupNowOnce({ ms: nowMs });

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
      const startedAtMs = 1;
      const { ttlMs, pollMs, waitCeilingMs } = instanceLifecycleStatics.bootLock;
      const nowMsFirstAttempt = startedAtMs;
      const nowMsSecondAttempt = (startedAtMs + waitCeilingMs);

      const staleLock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: (nowMsFirstAttempt - ttlMs - pollMs),
      });
      const freshLock = BootLockStub({
        heldBy: otherInstanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: (nowMsSecondAttempt - pollMs),
      });

      // Every exclusive create this test drives loses — the first to the stale file, the retry to
      // the competitor that beat this call back to the path.
      writeProxy.rejects({ path: bootLockPath, error: eexistError });
      unlinkProxy.succeeds({ path: bootLockPath });

      readProxy.returnsMatchingPath({
        path: (p: unknown) =>
          p === bootLockPath && readProxy.getCallsFor({ path: bootLockPath }).length === 1,
        contents: JSON.stringify(staleLock),
      });
      readProxy.returnsMatchingPath({
        path: (p: unknown) =>
          p === bootLockPath && readProxy.getCallsFor({ path: bootLockPath }).length > 1,
        contents: JSON.stringify(freshLock),
      });

      // call 1: startedAtMs (broker entry). call 2: nowMs for the first (failed) attempt. call 3:
      // nowMs for the retry, already at the wait ceiling.
      clockProxy.setupNowOnce({ ms: startedAtMs });
      clockProxy.setupNowOnce({ ms: nowMsFirstAttempt });
      clockProxy.setupNowOnce({ ms: nowMsSecondAttempt });

      return {
        expectedError: new BootLockHeldError({
          heldBy: otherInstanceId,
          waitedMs: nowMsSecondAttempt - startedAtMs,
        }),
      };
    },

    getWrittenLock: (): unknown => {
      const written = writeProxy.getCallsFor({ path: bootLockPath }).at(-1)?.[1];
      return typeof written === 'string' ? JSON.parse(written) : undefined;
    },

    // The options (3rd argument) of the LAST write to boot.lock — the `wx` flag lives there.
    getLastWriteOptions: (): unknown => writeProxy.getCallsFor({ path: bootLockPath }).at(-1)?.[2],

    // Every call this broker ever makes is against the SAME rootPath, so the count of calls
    // matching it, each mapped back to that one path, is the created-dirs list a test compares
    // against `[proxy.rootPath]`.
    getCreatedDirs: (): readonly unknown[] =>
      mkdirProxy.getCallsFor({ path: String(rootPath) }).map(() => rootPath),
  };
};
