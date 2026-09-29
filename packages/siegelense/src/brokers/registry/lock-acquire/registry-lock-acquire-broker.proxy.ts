import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { FileExistsRecordedErrorStub } from '#gateway/node/fs/file-exists-recorded-error/file-exists-recorded-error.stub';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import { unlinkIfExistsProxy } from '#gateway/node/fs__promises/unlink-if-exists/unlink-if-exists.proxy';
import { writeFileExclusiveProxy } from '#gateway/node/fs__promises/write-file-exclusive/write-file-exclusive.proxy';
import { locationsRegistryLockPathFindBrokerProxy } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker.proxy';
import { locationsRootPathFindBrokerProxy } from '../../locations/root-path-find/locations-root-path-find-broker.proxy';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

type EpochMs = ReturnType<typeof EpochMsStub>;

const HOME_DIR = '/home/user';
const HOME_PATH_VALUE = `${HOME_DIR}/.dungeonmaster`;
const ROOT_PATH_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense`;
const REGISTRY_LOCK_VALUE = `${HOME_DIR}/.dungeonmaster/siegelense/registry.lock`;

// Every failure staged here is a gateway stub addressed by this file's own registry.lock path: the
// recorded EEXIST for a lost exclusive create, and `FsErrorStub` for the read and unlink codes
// (EMFILE, EACCES) no recorded stub covers.
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
  getLastWriteOptions: () => unknown;
  getDeletedPaths: () => unknown[];
  getCreatedDirs: () => readonly unknown[];
} => {
  const lockPath = AbsoluteFilePathStub({ value: REGISTRY_LOCK_VALUE });
  const rootPath = FilePathStub({ value: ROOT_PATH_VALUE });
  const homePath = FilePathStub({ value: HOME_PATH_VALUE });

  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathProxy = locationsRegistryLockPathFindBrokerProxy();
  const mkdirProxy = ensureDirProxy();
  // `ensureDirProxy` carries no unaddressed catch-all default. `rootPath` is a fixed constant here
  // (not scenario-dependent — every real invocation of `registryLockAcquireBroker` calls
  // `ensureDir` with this exact value, since `locationsRootPathFindBroker`'s own join resolves it
  // for real via a sticky passthrough even when `setupRootPath` below is never called), so this
  // stages it unconditionally at construction, addressed to the one real value — active regardless
  // of which setup method below a caller ends up invoking.
  mkdirProxy.succeeds({ path: rootPath });
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

  isFsErrorProxy();
  setTimeoutProxy();
  const readProxy = readFileIfExistsProxy();
  const writeProxy = writeFileExclusiveProxy();
  const unlinkProxy = unlinkIfExistsProxy();
  const eexistError = FileExistsRecordedErrorStub({ path: REGISTRY_LOCK_VALUE });
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
      writeProxy.succeeds({ path: lockPath });
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
      writeProxy.rejectsOnce({ path: lockPath, error: eexistError });
      readProxy.returns({
        path: lockPath,
        contents: String(acquiredAtMs),
      });
      unlinkProxy.succeeds({ path: lockPath });
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
      writeProxy.rejectsOnce({ path: lockPath, error: eexistError });
      readProxy.returns({
        path: lockPath,
        contents: String(acquiredAtMs),
      });
      unlinkProxy.missing({ path: lockPath });
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
      writeProxy.rejectsOnce({ path: lockPath, error: eexistError });
      readProxy.returns({
        path: lockPath,
        contents: String(acquiredAtMs),
      });
      unlinkProxy.rejects({
        path: lockPath,
        error: FsErrorStub({ code: 'EACCES', path: REGISTRY_LOCK_VALUE, syscall: 'unlink' }),
      });
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
      writeProxy.rejects({ path: lockPath, error: eexistError });

      readProxy.returns({
        path: lockPath,
        contents: String(heldAcquiredAtMs),
      });

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
      writeProxy.rejects({ path: lockPath, error: eexistError });
      readProxy.throwsMatchingPath({
        path: lockPath,
        error: FsErrorStub({ code: 'EMFILE', path: REGISTRY_LOCK_VALUE, syscall: 'open' }),
      });
    },

    // FIRST exclusive create fails (a competitor's file was there) → the read that classifies it
    // finds nothing (ENOENT) — its holder released it in between → RETRY exclusive create
    // (staged separately via setupAvailable) takes the now-genuinely-absent path.
    setupLockVanishesBeforeRetryRead: (): void => {
      stagePathResolution();
      writeProxy.rejectsOnce({ path: lockPath, error: eexistError });
      readProxy.missing({ path: lockPath });
    },

    // The options (3rd argument) of the LAST write to registry.lock — the `wx` flag lives there.
    getLastWriteOptions: (): unknown => writeProxy.getCallsFor({ path: lockPath }).at(-1)?.[2],

    getDeletedPaths: (): unknown[] =>
      unlinkProxy.getCallsFor({ path: lockPath }).map((call) => call[0]),

    getCreatedDirs: (): readonly unknown[] =>
      mkdirProxy.getCallsFor({ path: rootPath }).map((call) => call[0]),
  };
};
