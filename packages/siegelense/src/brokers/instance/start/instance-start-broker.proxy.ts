import { existsSync } from 'fs';
import { access, readFile, realpath, rename, unlink, writeFile } from 'fs/promises';
import { dirname, join } from '#gateway/node/path';
import { cwd } from '#gateway/node/process';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FilePathStub,
  NetworkPortStub,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { FilePath, TimeoutMs } from '@dungeonmaster/shared/contracts';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { DevServerE2eProcess } from '@dungeonmaster/config';

import { capacityReadBroker } from '../../capacity/read/capacity-read-broker';
import { capacityReadBrokerProxy } from '../../capacity/read/capacity-read-broker.proxy';
import { CapacityAnswerStub } from '../../../contracts/capacity-answer/capacity-answer.stub';
import { instanceReleaseBrokerProxy } from '../release/instance-release-broker.proxy';
import { instanceReserveBrokerProxy } from '../reserve/instance-reserve-broker.proxy';
import { profileBootRecordBrokerProxy } from '../../profile/boot-record/profile-boot-record-broker.proxy';
import { recipeSeedRunBroker } from '../../recipe/seed-run/recipe-seed-run-broker';
import { recipeSeedRunBrokerProxy } from '../../recipe/seed-run/recipe-seed-run-broker.proxy';
import type { RecipeName } from '../../../contracts/recipe-name/recipe-name-contract';
import { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';
import { instanceKillBrokerProxy } from '../kill/instance-kill-broker.proxy';
import { bootLockAcquireBrokerProxy } from '../../boot-lock/acquire/boot-lock-acquire-broker.proxy';
import { bootLockReleaseBrokerProxy } from '../../boot-lock/release/boot-lock-release-broker.proxy';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { laneSpecFindBrokerProxy } from '../../lane-spec/find/lane-spec-find-broker.proxy';
import { laneSpecHashBrokerProxy } from '../../lane-spec/hash/lane-spec-hash-broker.proxy';
import { fsOpenFdAdapterProxy } from '../../../adapters/fs/open-fd/fs-open-fd-adapter.proxy';
import { childProcessSpawnDetachedAdapterProxy } from '../../../adapters/child-process/spawn-detached/child-process-spawn-detached-adapter.proxy';
import { cliPackageBinResolveAdapterProxy } from '../../../adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.proxy';
import { osTmpdirAdapterProxy } from '../../../adapters/os/tmpdir/os-tmpdir-adapter.proxy';
import { instanceStartBootPollLayerBrokerProxy } from './instance-start-boot-poll-layer-broker.proxy';
import { laneReadyWaitBrokerProxy } from '../../lane/ready-wait/lane-ready-wait-broker.proxy';
import { FileDescriptorStub } from '../../../contracts/file-descriptor/file-descriptor.stub';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import type { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import type { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import { shutdownReasonWriteBrokerProxy } from '../../shutdown-reason/write/shutdown-reason-write-broker.proxy';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { profileStatics } from '../../../statics/profile/profile-statics';

type InstanceId = ReturnType<typeof InstanceIdStub>;
type Registry = ReturnType<typeof RegistryStub>;
type SpecName = ReturnType<typeof SpecNameStub>;

// Every path below is REAL `path.join` output off two sticky roots (os.homedir() and `cwd()`'s
// own built-in default) — never a one-shot stage on `#gateway/node/path`'s `join` mock.
// instanceReserveBroker, bootLockAcquireBroker and every registry broker they compose ALSO
// resolve their own paths through the SAME real `join` passthrough, so one sticky root answers
// every caller consistently regardless of how many times each resolver runs — a one-shot queue
// shared across a dozen unrelated resolvers has no such guarantee (the wrong call consumes the
// wrong entry the moment two callers interleave).
const HOME_DIR_VALUE = '/home/user';
const HOME_PATH_VALUE = `${HOME_DIR_VALUE}/.dungeonmaster`;
const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const REGISTRY_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json`;
const REGISTRY_TMP_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json.tmp`;
const REGISTRY_LOCK_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.lock`;
const BOOT_LOCK_PATH_VALUE = `${ROOT_PATH_VALUE}/boot.lock`;
const CWD_PATH_VALUE = '/default/cwd';
const CONFIG_FILE_PATH_VALUE = `${CWD_PATH_VALUE}/.dungeonmaster.json`;
// Built from locationsStatics rather than a re-hardcoded literal, so this constant tracks
// locationsRepoLinkPathFindBroker's own linkPath composition instead of drifting the moment the
// nesting under repoRoot changes again. Plain string interpolation, NOT the real `join` call every
// other path below uses: `join` (imported at the top of this file from '#gateway/node/path') is
// one of the functions `registerMock` governs, so calling it here at MODULE scope — before any
// proxy in this file has run its constructor and staged the real-passthrough default — hits the
// unconfigured mock and resolves to `undefined`, exactly as `join()` would if called at module
// scope anywhere else in this file. `locationsStatics` itself is a plain object, never mocked.
const LINK_PATH_VALUE = `${CWD_PATH_VALUE}/${locationsStatics.repoRoot.dungeonmasterAssets}/${locationsStatics.repoRoot.siegelenseLink}`;
const TMP_DIR_VALUE = '/tmp';
// cliPackageBinResolveAdapter resolves @dungeonmaster/cli's package root through a REAL
// require.resolve() call (never mocked — see cliPackageBinResolveAdapterProxy's own comment).
const CLI_BIN_RELATIVE_VALUE = './dist/bin/dungeonmaster.js';
const MINTED_UUID_VALUE = '7f3a9c21-58cc-4372-a567-0e02b2c3d479';
const FIRST_PORT_VALUE = 40_000;
const SECOND_PORT_VALUE = 40_001;
// boot-lock-acquire-broker.proxy.ts and boot-lock-release-broker.proxy.ts each pre-stage their
// OWN one-shot pathJoin/homedir resolutions unconditionally in their constructors (never gated
// behind a semantic setup method) — 4 rounds of {homedir-join, root-join, bootlock-join} for
// acquire, 1 round for release, 15 pathJoin one-shots total. enforce-proxy-child-creation requires
// BOTH proxies be constructed here even though this file never calls their setup methods, so those
// one-shots sit queued ahead of every real call this test drives. Draining well past that count
// empties the queue back to this file's own sticky real-passthrough default on `join`, which every
// call in this file relies on; a call past the real queue length is a harmless real join.
const PATH_JOIN_DRAIN_COUNT = 40;
// this broker's own nowMsForStaleness (1) + instanceReserveBroker's reservedAtMs (1) +
// registryLockAcquireBroker's startedAtMs/nowMs (2) + this broker's own lockWaitStartedAtMs (1) +
// bootLockAcquireBroker's startedAtMs/nowMs (2) + this broker's own lockWaitEndedAtMs (1) +
// bootStartedAtMs (1) — every Date.now() call the real broker makes before the poll layer's own
// first deadline check, on a registry with no stale entries (a stale reap adds more, internal to
// instanceKillBroker, ahead of all of these).
const DATE_NOW_CALLS_BEFORE_POLL_CHECK = 9;
// Same count, minus the two calls made AFTER this broker's own lockWaitEndedAtMs (bootStartedAtMs
// and the poll's own check) — the position queuedMs's second bracket (lockWaitEndedAtMs) lands on.
const DATE_NOW_CALLS_BEFORE_QUEUED_MS_END = 7;

const REGISTRY_PATH_FILE = FilePathStub({ value: REGISTRY_PATH_VALUE });
const REGISTRY_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_PATH_VALUE });
const REGISTRY_TMP_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_TMP_PATH_VALUE });
const REGISTRY_LOCK_PATH_ABS = AbsoluteFilePathStub({ value: REGISTRY_LOCK_PATH_VALUE });
const BOOT_LOCK_PATH_ABS = AbsoluteFilePathStub({ value: BOOT_LOCK_PATH_VALUE });
const CONFIG_FILE_PATH = FilePathStub({ value: CONFIG_FILE_PATH_VALUE });
const LINK_PATH_FILE = FilePathStub({ value: LINK_PATH_VALUE });
const HOME_PATH = FilePathStub({ value: HOME_PATH_VALUE });

export const instanceStartBrokerProxy = (): {
  setupHappyBoot: (params: {
    instanceId: InstanceId;
    evidencePath: FilePath;
    registry: Registry;
    idleTimeoutMs?: TimeoutMs;
  }) => void;
  setupHappyBootWithQueuedMs: (params: {
    instanceId: InstanceId;
    evidencePath: FilePath;
    registry: Registry;
    startedAtMs: number;
    queuedMs: number;
  }) => void;
  setupBootNeverAnswers: (params: {
    instanceId: InstanceId;
    evidencePath: FilePath;
    registry: Registry;
    nowMs: number;
  }) => void;
  setupBootFailureMarkerAppears: (params: {
    instanceId: InstanceId;
    evidencePath: FilePath;
    registry: Registry;
    driverMessage: string;
  }) => void;
  stageInstanceReleaseWriteFails: (params: { error: Error }) => void;
  stageBootLockAcquireFailsWithReadError: (params: { registry: Registry; error: Error }) => void;
  stageSeedFails: (params: { seed: RecipeName; error: Error }) => void;
  getWriteOrder: () => readonly FilePath[];
  getBootLockReleasedPaths: () => unknown[];
  getLastRegistryWriteContent: () => unknown;
  getStderrMessages: () => readonly ReturnType<typeof ContentTextStub>[];
  mintInstanceId: () => InstanceId;
  setupStaleReap: (params: { staleInstanceId: InstanceId }) => void;
  stageLaneSpec: (params: { processes: readonly DevServerE2eProcess[] }) => void;
  stageProcessReachable: (params: { url: string }) => void;
  stageProcessUnreachable: (params: { url: string }) => void;
  setupCapacityRefusal: (params: { specName: SpecName; why: string }) => void;
  getKillConnectionCountFor: (params: {
    instanceId: InstanceId;
  }) => ReturnType<typeof ReadingCountStub>;
  stageShutdownReasonWriteSucceeds: (params: { evidencePath: FilePath }) => void;
  getWrittenShutdownReason: (params: { evidencePath: FilePath }) => unknown;
} => {
  // Composed (not phantom) — this file stages its own branch answer and port candidates through
  // reserveProxy's own semantic methods below, rather than through a one-shot stub any of these
  // would otherwise queue onto a shared mock.
  const reserveProxy = instanceReserveBrokerProxy();
  // instanceReserveBroker now reads the real git branch through @dungeonmaster/bin/git's
  // currentBranch, which — unlike the adapter it replaces — has no constructor-time default and
  // throws on an unaddressed call. No test in this file asserts on `branch`, so this stages the
  // same "no branch" answer the old adapter's proxy defaulted to implicitly.
  reserveProxy.setupBranch({ branch: null });
  // instanceReleaseBroker (called on every failed-boot path, defect 2) composes real
  // registryUpdateBroker underneath — the SAME generic writeFile/readFile mocks staged below
  // already satisfy it, matching how instanceReserveBroker's own registryUpdateBroker call runs
  // real against these identical mocks.
  instanceReleaseBrokerProxy();
  registryReadBrokerProxy();
  // Constructed for enforce-proxy-child-creation only. capacityReadBroker itself is staged directly
  // below, so none of the three reads this proxy composes ever runs; anything its own construction
  // queues onto the shared pathJoin mock is absorbed by stageBoot's drain.
  capacityReadBrokerProxy();
  bootLockAcquireBrokerProxy();
  bootLockReleaseBrokerProxy();
  locationsInstanceEvidencePathFindBrokerProxy();
  // Captured (not composed bare) so its own setupHomeOnly/setupCwd can stage the addressed home
  // and cwd this broker's own locationsRepoLinkPathFindBroker call reads, never a raw 'os' mock or
  // the real process.cwd() — the instanceKillBrokerProxy.setupRegistry/setupCwd convention.
  const repoLinkProxy = locationsRepoLinkPathFindBrokerProxy();
  locationsSocketPathFindBrokerProxy();
  // laneSpecFindBrokerProxy() stages its own sticky default (a single headless api process) at
  // construction, so every test in this file that leaves the spec untouched still resolves a real,
  // valid LaneSpec — a later stageLaneSpec() call overrides that same address.
  const laneSpecFindProxy = laneSpecFindBrokerProxy();
  laneSpecHashBrokerProxy();
  cwdResolveBrokerProxy();
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — this
  // broker's own five joins (driver log, throwaway home, api log, web log) and every join a
  // composed child proxy resolves transitively all share it.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  // Constructed for enforce-proxy-child-creation. Its own setup methods are never called here: the
  // boot record's path is keyed by the spec's REAL content hash, which no test in this file names,
  // so the write below is addressed by a predicate on the boots directory instead.
  profileBootRecordBrokerProxy();
  // Constructed for enforce-proxy-child-creation: instanceStartBroker now calls
  // shutdownReasonWriteBroker directly too (a seed failure's own reason), even though every actual
  // write in this file's tests still goes through killProxy's own composed instance of this same
  // proxy — registerMock dedups the underlying writeFile mock by function reference regardless of
  // which composition constructed it.
  shutdownReasonWriteBrokerProxy();
  // Constructed for enforce-proxy-child-creation. `recipeSeedRunBroker` itself is staged DIRECTLY
  // below (stageSeedFails) rather than through this proxy's own book/lane setup — same reasoning as
  // capacityReadBroker above: recipesLocateBrokerProxy's own book-present staging is fixed to a
  // `/repo` cwd, which would collide with this file's own `/default/cwd` staging the moment both
  // run in the same test.
  recipeSeedRunBrokerProxy();
  // instanceStartBroker's opportunistic stale-reap calls instanceKillBroker directly (chunk-2
  // plan: "cleanup will call the same broker" — kill IS the reap primitive), so its proxy is a
  // real child-proxy composition, not a phantom one, and its OWN setupDriverUnreachableNoPgids
  // is what setupStaleReap below reaches for instead of hand-building the socket/registry-pgids/rm
  // mocks a second time.
  const killProxy = instanceKillBrokerProxy();

  const openFdProxy = fsOpenFdAdapterProxy();
  const spawnProxy = childProcessSpawnDetachedAdapterProxy();
  const cliBinProxy = cliPackageBinResolveAdapterProxy();
  cliBinProxy.manifestDeclaresBin({ binRelative: CLI_BIN_RELATIVE_VALUE });
  const tmpdirProxy = osTmpdirAdapterProxy();
  const pollProxy = instanceStartBootPollLayerBrokerProxy();
  const readyWaitProxy = laneReadyWaitBrokerProxy();
  cwdProxy(); // gateway proxy import — inert, satisfies enforce-proxy-child-creation
  const cwdHandle = registerMock({ fn: cwd });
  const stderrHandle = registerSpyOn({ object: process.stderr, method: 'write' });

  const existsHandle: MockHandle = registerMock({ fn: existsSync });
  const readHandle: MockHandle = registerMock({ fn: readFile });
  const writeHandle: MockHandle = registerMock({ fn: writeFile });
  const unlinkHandle: MockHandle = registerMock({ fn: unlink });
  const realpathHandle: MockHandle = registerMock({ fn: realpath });
  const renameHandle: MockHandle = registerMock({ fn: rename });
  const accessHandle: MockHandle = registerMock({ fn: access });

  // instanceStartBroker asks `capacity` whether the machine can hold another instance before it
  // reserves one. It is staged DIRECTLY rather than composed: capacityReadBroker's own reads
  // (registry, host, profile tree) would each queue onto the shared pathJoin and fs mocks this file
  // already hand-counts, and what every test here needs from it is a single number. The
  // constructor-level catch-all is the permissive answer — every scenario in this file is a machine
  // with room — so only the refusal cases below describe a call of their own, at a strictly more
  // specific address.
  const capacityHandle: MockHandle = registerMock({ fn: capacityReadBroker });
  capacityHandle.calledWith([]).resolves(CapacityAnswerStub());

  // Staged directly for the same reason capacityReadBroker is above — see the constructor comment
  // on recipeSeedRunBrokerProxy() for why composing its own child staging is unsafe here. No
  // constructor-level default: every test in this file either never seeds (seed: null, never
  // reaches this call) or stages stageSeedFails() at the specific recipe address it names.
  const recipeSeedHandle: MockHandle = registerMock({ fn: recipeSeedRunBroker });

  registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(MINTED_UUID_VALUE);
  const dateNowHandle = registerSpyOn({ object: Date, method: 'now' });
  dateNowHandle.calledWith([]).returns(EpochMsStub().valueOf());

  tmpdirProxy.returns({ path: TMP_DIR_VALUE });
  cwdHandle.calledWith([]).returns(CWD_PATH_VALUE);
  accessHandle.calledWith([CONFIG_FILE_PATH]).resolves({ success: true as const });
  // Record-and-swallow: no test cares what stderr does with the write, only what was written —
  // asserted separately via getStderrMessages/callsMatching.
  stderrHandle.calledWith([]).returns(true);

  existsHandle.calledWith([REGISTRY_PATH_FILE]).returns(true);
  existsHandle.calledWith([LINK_PATH_FILE]).returns(true);
  realpathHandle.calledWith([LINK_PATH_FILE]).resolves(ROOT_PATH_VALUE);

  writeHandle.calledWith([REGISTRY_TMP_PATH_ABS]).resolves(undefined);
  writeHandle.calledWith([REGISTRY_LOCK_PATH_ABS]).resolves(undefined);
  writeHandle.calledWith([BOOT_LOCK_PATH_ABS]).resolves(undefined);
  // The boot profile record a successful boot writes. Addressed by a predicate rather than a
  // literal path because its directory is the spec's real sha256 content hash — a value no test
  // here names, and one that changes the moment a lane spec does. A literal `calledWith([path])`
  // staged elsewhere still outranks this, so it shadows nothing.
  writeHandle
    .calledWith([
      (candidate: unknown): boolean => String(candidate).includes(profileStatics.dirs.boots),
    ])
    .resolves(undefined);
  // registryLockReleaseBroker unlinks unconditionally once registryUpdateBroker's write finishes
  // (no heldBy check, unlike boot.lock's release) — staged sticky for every happy-path reserve.
  unlinkHandle.calledWith([REGISTRY_LOCK_PATH_ABS]).resolves(undefined);
  renameHandle.calledWith([REGISTRY_TMP_PATH_ABS]).resolves(undefined);

  // instanceReserveBroker asks the OS for `claimAttempts` port-pair candidates upfront, through
  // reserveProxy's own freePortPair() staging — every scenario in this file is a machine with room
  // and no port collision, so every candidate resolves to the same fixed pair; the exact numbers
  // only need to differ from each other, never match a real free port.
  reserveProxy.setupPortCandidates({
    pairs: Array.from({ length: instanceLifecycleStatics.ports.claimAttempts }, () => ({
      api: NetworkPortStub({ value: FIRST_PORT_VALUE }),
      web: NetworkPortStub({ value: SECOND_PORT_VALUE }),
    })),
  });

  const stageBoot = ({
    instanceId,
    evidencePath,
    registry,
    idleTimeoutMs,
  }: {
    instanceId: InstanceId;
    evidencePath: FilePath;
    registry: Registry;
    idleTimeoutMs?: TimeoutMs;
  }): void => {
    // dungeonmasterHomeFindBroker checks DUNGEONMASTER_HOME before falling back to homedir() from
    // '#gateway/node/os' — staged through locationsRepoLinkPathFindBrokerProxy's own setupHomeOnly
    // forward (the instanceKillBrokerProxy.setupRegistry pattern), never a raw 'os' mock:
    // dungeonmasterHomeFindBroker never touches the raw 'os' module, so a mock on it is never
    // reached. Called explicitly here rather than relying on bootLockAcquireBrokerProxy's own
    // constructor incidentally staging the same address via the dungeonmasterHomeFindBrokerProxy it
    // composes — that stage is a side effect of an unrelated proxy's setup, not a guarantee this
    // file controls.
    repoLinkProxy.setupHomeOnly({ homeDir: HOME_DIR_VALUE, homePath: HOME_PATH });
    // locationsRepoLinkPathFindBroker calls cwd() on every invocation, and instanceReserveBroker's
    // own git-branch lookup shares this same '#gateway/node/process' cwd() mock — staged here so
    // neither ever reads the real working directory.
    repoLinkProxy.setupCwd({ cwdPath: CWD_PATH_VALUE });

    // Drains the onceFor entries boot-lock-acquire-broker.proxy.ts and
    // boot-lock-release-broker.proxy.ts queued unconditionally at construction time (see the note
    // on PATH_JOIN_DRAIN_COUNT above) — done here rather than in the constructor because this
    // rule's own "no side effects before return" check does not reach a nested helper like this
    // one, only the outer proxy factory's own top-level statements.
    Array.from({ length: PATH_JOIN_DRAIN_COUNT }, (_unused, drainIndex) => drainIndex).forEach(
      (drainIndex) => {
        join('drain', String(drainIndex));
      },
    );

    // Computed AFTER the drain above, for the same reason the drain exists at all: `join` (from
    // '#gateway/node/path') is globally mocked as a one-shot QUEUE by other composed proxies, and
    // a call made before the queue is drained steals an entry staged for an unrelated caller
    // instead of reaching the sticky real-passthrough default. Must mirror the real
    // cliPackageBinResolveAdapter's own require.resolve('@dungeonmaster/cli') +
    // join(dirname(...), ...) exactly.
    const expectedDriverBinPath = join(
      dirname(require.resolve('@dungeonmaster/cli')),
      CLI_BIN_RELATIVE_VALUE,
    );

    readHandle.calledWith([REGISTRY_PATH_ABS]).resolves(JSON.stringify(registry));

    // A boot that reaches the poll answering `ready` is one the DRIVER already released boot.lock
    // for itself (its own docstring) — the sticky default here is that ordinary case, so a caller
    // whose OWN failure (a seed) runs the catch block's bootLockReleaseBroker call for the first
    // time in a happy-boot test finds no lock left to release, exactly as a real released lock reads.
    readHandle
      .calledWith([BOOT_LOCK_PATH_ABS])
      .rejects(Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }));

    const driverLogPath = AbsoluteFilePathStub({ value: `${String(evidencePath)}/driver.log` });
    openFdProxy.returns({ filePath: driverLogPath, fd: FileDescriptorStub({ value: 17 }) });

    spawnProxy.succeeds({
      command: process.execPath,
      args: [
        expectedDriverBinPath,
        'siegelense',
        'driver',
        '--instance',
        instanceId,
        ...(idleTimeoutMs === undefined ? [] : ['--idle-timeout-ms', String(idleTimeoutMs)]),
      ],
      pid: 4821,
    });
  };

  return {
    setupHappyBoot: ({ instanceId, evidencePath, registry, idleTimeoutMs }): void => {
      stageBoot(
        idleTimeoutMs === undefined
          ? { instanceId, evidencePath, registry }
          : { instanceId, evidencePath, registry, idleTimeoutMs },
      );

      const socketPath = AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`,
      });
      pollProxy.setupAnswersOk({ socketPath });
    },

    setupHappyBootWithQueuedMs: ({
      instanceId,
      evidencePath,
      registry,
      startedAtMs,
      queuedMs,
    }: {
      instanceId: InstanceId;
      evidencePath: FilePath;
      registry: Registry;
      startedAtMs: number;
      queuedMs: number;
    }): void => {
      stageBoot({ instanceId, evidencePath, registry });

      // The 7 Date.now() calls ahead of this broker's own lockWaitEndedAtMs (see
      // DATE_NOW_CALLS_BEFORE_QUEUED_MS_END) all answer startedAtMs — including this broker's
      // OWN lockWaitStartedAtMs, position 5 of the 7 — so lockWaitEndedAtMs (staged next, below)
      // is the only call that reports the elapsed wait.
      Array.from(
        { length: DATE_NOW_CALLS_BEFORE_QUEUED_MS_END },
        (_unused, index) => index,
      ).forEach(() => {
        dateNowHandle.onceFor([]).returns(startedAtMs);
      });
      dateNowHandle.onceFor([]).returns(startedAtMs + queuedMs);

      const socketPath = AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`,
      });
      pollProxy.setupAnswersOk({ socketPath });
    },

    setupBootNeverAnswers: ({ instanceId, evidencePath, registry, nowMs }): void => {
      stageBoot({ instanceId, evidencePath, registry });

      // Every real Date.now() call ahead of the poll's own deadline check — reserve's
      // reservedAtMs, registryLockAcquireBroker's startedAtMs/nowMs, this broker's own
      // lockWaitStartedAtMs/lockWaitEndedAtMs, bootLockAcquireBroker's startedAtMs/nowMs, and
      // bootStartedAtMs — consumes one of these first, in order, so the poll's check (the very
      // next Date.now() call, staged by pollProxy.setupNeverAnswers below) lands on the
      // already-past-deadline value instead of a real ~180s wait.
      Array.from({ length: DATE_NOW_CALLS_BEFORE_POLL_CHECK }, (_unused, index) => index).forEach(
        () => {
          dateNowHandle.onceFor([]).returns(nowMs);
        },
      );

      const socketPath = AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`,
      });
      const evidencePathAbs = AbsoluteFilePathStub({ value: String(evidencePath) });
      pollProxy.setupNeverAnswers({
        socketPath,
        evidencePath: evidencePathAbs,
        nowMs,
        deadlineMs: nowMs + driverStatics.boot.defaultTimeoutMs,
      });

      readHandle
        .calledWith([BOOT_LOCK_PATH_ABS])
        .resolves(JSON.stringify({ heldBy: instanceId, heldByPid: '4821', acquiredAtMs: nowMs }));
      unlinkHandle.calledWith([BOOT_LOCK_PATH_ABS]).resolves(undefined);

      // The driver's own ping never answers here, but this stages nothing about WHICH lane
      // process is unready — instanceStartBroker now probes each checkable process's own
      // readyPath directly once the ping times out, so a caller of this method also stages
      // `stageLaneSpec` and a `stageProcessReachable`/`stageProcessUnreachable` per process it
      // cares about.

      // The catch block's cleanup now calls instanceKillBroker rather than releasing the
      // registry row directly — its socket attempt fails the same way the poll's own did (same
      // shared connection mock), so it falls to the orphan-reap path: the registry row this
      // scenario stages carries no pgids (a driver that never answers ping never got as far as a
      // heartbeat), so nothing is signalled, and only the throwaway home needs removing.
      killProxy.setupDriverUnreachableNoPgids({
        socketPath,
        homePath: AbsoluteFilePathStub({ value: `${TMP_DIR_VALUE}/dm-siege-${instanceId}` }),
      });
    },

    setupBootFailureMarkerAppears: ({
      instanceId,
      evidencePath,
      registry,
      driverMessage,
    }: {
      instanceId: InstanceId;
      evidencePath: FilePath;
      registry: Registry;
      driverMessage: string;
    }): void => {
      stageBoot({ instanceId, evidencePath, registry });

      const socketPath = AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`,
      });
      const evidencePathAbs = AbsoluteFilePathStub({ value: String(evidencePath) });
      pollProxy.setupFailureMarkerAppears({
        socketPath,
        evidencePath: evidencePathAbs,
        marker: BootFailureMarkerStub({ message: ContentTextStub({ value: driverMessage }) }),
      });

      // The driver never got as far as writing a boot lock in this scenario either — it dies
      // before laneBootBroker's own success path stamps anything — so releasing boot.lock reads
      // the same acquired-by-this-instance shape the timeout path above stages.
      readHandle
        .calledWith([BOOT_LOCK_PATH_ABS])
        .resolves(JSON.stringify({ heldBy: instanceId, heldByPid: '4821', acquiredAtMs: 0 }));
      unlinkHandle.calledWith([BOOT_LOCK_PATH_ABS]).resolves(undefined);

      // Same reasoning as setupBootNeverAnswers above: the catch's instanceKillBroker call falls
      // to the orphan-reap path against a socket that never answered, and a driver that died
      // before ever finishing its boot never wrote a heartbeat naming any pgids either.
      killProxy.setupDriverUnreachableNoPgids({
        socketPath,
        homePath: AbsoluteFilePathStub({ value: `${TMP_DIR_VALUE}/dm-siege-${instanceId}` }),
      });
    },

    // Reserve's own write (state: 'alive') always lands first and must keep succeeding — only the
    // SECOND write to registry.json.tmp (instanceReleaseBroker's, after the boot fails) is made to
    // fail, via a queued pair of one-shots on the SAME shared writeFile mock every registry broker
    // in this file shares.
    stageInstanceReleaseWriteFails: ({ error }: { error: Error }): void => {
      writeHandle.onceFor([REGISTRY_TMP_PATH_ABS]).resolves(undefined);
      writeHandle.onceFor([REGISTRY_TMP_PATH_ABS]).rejects(error);
    },

    getWriteOrder: (): readonly FilePath[] =>
      writeHandle.callsMatching([]).map((call) => filePathContract.parse(String(call[0]))),

    getBootLockReleasedPaths: (): unknown[] =>
      unlinkHandle.callsMatching([BOOT_LOCK_PATH_ABS]).map((call) => call[0]),

    getLastRegistryWriteContent: (): unknown => {
      const calls = writeHandle.callsMatching([REGISTRY_TMP_PATH_ABS]);
      const lastCall = calls[calls.length - 1];
      return lastCall === undefined ? undefined : JSON.parse(String(lastCall[1]));
    },

    getStderrMessages: (): readonly ReturnType<typeof ContentTextStub>[] =>
      stderrHandle.callsMatching([]).map((call) => ContentTextStub({ value: String(call[0]) })),

    mintInstanceId: (): InstanceId =>
      InstanceIdStub({ value: `inst_${MINTED_UUID_VALUE.split('-').join('')}` }),

    stageLaneSpec: ({ processes }: { processes: readonly DevServerE2eProcess[] }): void => {
      laneSpecFindProxy.setupConfiguredProcesses({ processes });
    },

    stageProcessReachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupReachable({ url });
    },

    stageProcessUnreachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupUnreachable({ url });
    },

    // Addressed by the spec name the broker really passes, which outranks the permissive catch-all
    // staged in the constructor. `suggested: 0` is the one condition instanceStartBroker refuses on,
    // and `why` is carried into CapacityRefusedError verbatim, so a test asserts the sentence it
    // staged here rather than a message this proxy wrote.
    setupCapacityRefusal: ({ specName, why }: { specName: SpecName; why: string }): void => {
      capacityHandle
        .calledWith([{ specName }])
        .resolves(CapacityAnswerStub({ suggested: 0, why, profile: null }));
    },

    setupStaleReap: ({ staleInstanceId }: { staleInstanceId: InstanceId }): void => {
      const staleSocketPath = AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/dm-siege-sockets/${staleInstanceId}.sock`,
      });
      const staleHomePath = AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/dm-siege-${staleInstanceId}`,
      });

      killProxy.setupDriverUnreachableNoPgids({
        socketPath: staleSocketPath,
        homePath: staleHomePath,
      });
    },

    // Bypasses bootLockAcquireBroker's real polling/takeover logic entirely: the exclusive create
    // loses to a file already there (EEXIST, the broker's own first move on every call), and the
    // read that classifies that failure fails for a reason that has nothing to do with absence —
    // the ONE branch that throws immediately, with no retry and no Date.now() sequencing to stage.
    stageBootLockAcquireFailsWithReadError: ({
      registry,
      error,
    }: {
      registry: Registry;
      error: Error;
    }): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      // Same drain `stageBoot` runs, for the same reason (see PATH_JOIN_DRAIN_COUNT above):
      // bootLockAcquireBrokerProxy/bootLockReleaseBrokerProxy each queue one-shot pathJoin
      // resolutions unconditionally at construction, and this scenario reaches registryReadBroker's
      // own real path joins before any of that queue has otherwise been drained.
      Array.from({ length: PATH_JOIN_DRAIN_COUNT }, (_unused, drainIndex) => drainIndex).forEach(
        (drainIndex) => {
          join('drain', String(drainIndex));
        },
      );
      readHandle.calledWith([REGISTRY_PATH_ABS]).resolves(JSON.stringify(registry));
      writeHandle
        .calledWith([BOOT_LOCK_PATH_ABS])
        .rejects(Object.assign(new Error('EEXIST: file already exists'), { code: 'EEXIST' }));
      readHandle.calledWith([BOOT_LOCK_PATH_ABS]).rejects(error);
    },

    // Addressed on the `recipe` field alone — a prefix match, so the real apiBaseUrl/homePath/
    // parameters the broker builds need never be named here.
    stageSeedFails: ({ seed, error }: { seed: RecipeName; error: Error }): void => {
      recipeSeedHandle.calledWith([{ recipe: seed }]).rejects(error);
    },

    getKillConnectionCountFor: ({
      instanceId,
    }: {
      instanceId: InstanceId;
    }): ReturnType<typeof ReadingCountStub> =>
      killProxy.getConnectionCountFor({
        socketPath: AbsoluteFilePathStub({
          value: `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`,
        }),
      }),

    stageShutdownReasonWriteSucceeds: ({ evidencePath }: { evidencePath: FilePath }): void => {
      killProxy.setupShutdownReasonWriteSucceeds({
        evidencePath: AbsoluteFilePathStub({ value: String(evidencePath) }),
      });
    },

    getWrittenShutdownReason: ({ evidencePath }: { evidencePath: FilePath }): unknown =>
      killProxy.getWrittenShutdownReason({
        evidencePath: AbsoluteFilePathStub({ value: String(evidencePath) }),
      }),
  };
};
