import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { randomUUID } from '#gateway/node/crypto';
import { tmpdir } from '#gateway/node/os';
import { dirname, join } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';
import { envSnapshotProxy } from '#gateway/node/process/env-snapshot/env-snapshot.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { DevServerE2eProcess } from '@dungeonmaster/config';

import { capacityReadBrokerProxy } from '../../capacity/read/capacity-read-broker.proxy';
import { leaseTakeBrokerProxy } from '@dungeonmaster/load-balancer/brokers/lease/take/lease-take-broker.proxy';
import { instanceReleaseBrokerProxy } from '../release/instance-release-broker.proxy';
import { instanceReserveBrokerProxy } from '../reserve/instance-reserve-broker.proxy';
import { profileBootRecordBrokerProxy } from '../../profile/boot-record/profile-boot-record-broker.proxy';
import { recipeSeedRunBrokerProxy } from '../../recipe/seed-run/recipe-seed-run-broker.proxy';
import { BootFailureMarkerStub } from '../../../contracts/boot-failure-marker/boot-failure-marker.stub';
import { instanceKillBrokerProxy } from '../kill/instance-kill-broker.proxy';
import { bootLockAcquireBrokerProxy } from '../../boot-lock/acquire/boot-lock-acquire-broker.proxy';
import { bootLockReleaseBrokerProxy } from '../../boot-lock/release/boot-lock-release-broker.proxy';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { registryUpdateBrokerProxy } from '../../registry/update/registry-update-broker.proxy';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRepoLinkPathFindBrokerProxy } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { locationsSocketPathFindBrokerProxy } from '../../locations/socket-path-find/locations-socket-path-find-broker.proxy';
import { laneSpecFindBrokerProxy } from '../../lane-spec/find/lane-spec-find-broker.proxy';
import { laneSpecHashBrokerProxy } from '../../lane-spec/hash/lane-spec-hash-broker.proxy';
import { openForAppendSyncProxy } from '#gateway/node/fs/open-for-append-sync/open-for-append-sync.proxy';
import { spawnDetachedProxy } from '#gateway/node/child_process/spawn-detached/spawn-detached.proxy';
import { packageBinResolveBrokerProxy } from '@dungeonmaster/shared/brokers/package-bin/resolve/package-bin-resolve-broker.proxy';
import { instanceStartBootPollLayerBrokerProxy } from './instance-start-boot-poll-layer-broker.proxy';
import { laneReadyWaitBrokerProxy } from '../../lane/ready-wait/lane-ready-wait-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import { shutdownReasonWriteBrokerProxy } from '../../shutdown-reason/write/shutdown-reason-write-broker.proxy';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { capacityStatics } from '../../../statics/capacity/capacity-statics';

type InstanceId = ReturnType<typeof InstanceIdStub>;
type Registry = ReturnType<typeof RegistryStub>;

// Every path below is what the composed child proxies stage by exact tuple off the addressed home
// and cwd; the `join` mock here is only the real passthrough for the segments no child names.
const HOME_DIR_VALUE = '/home/user';
const HOME_PATH_VALUE = `${HOME_DIR_VALUE}/.dungeonmaster`;
const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const CWD_PATH_VALUE = '/default/cwd';
const BOOT_LOCK_PATH_VALUE = `${ROOT_PATH_VALUE}/boot.lock`;
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
// The CLI as the repo root's own install lays it out — staged under CWD_PATH_VALUE only, so a
// broker that resolved the bin from anywhere else (this process's own install) finds nothing staged.
const CLI_PACKAGE_NAME_VALUE = '@dungeonmaster/cli';
const CLI_MANIFEST_PATH_VALUE = `${CWD_PATH_VALUE}/node_modules/${CLI_PACKAGE_NAME_VALUE}/package.json`;
const CLI_BIN_PATH_VALUE = `${CWD_PATH_VALUE}/node_modules/${CLI_PACKAGE_NAME_VALUE}/dist/bin/dungeonmaster.js`;
const CLI_RAW_MANIFEST_VALUE = '{"bin":{"dungeonmaster":"./dist/bin/dungeonmaster.js"}}';
const MINTED_UUID_VALUE = '7f3a9c21-58cc-4372-a567-0e02b2c3d479';
const MINTED_INSTANCE_ID_VALUE = `inst_${MINTED_UUID_VALUE.split('-').join('')}`;
// The minted instance's evidence directory when reserved with no owning quest or guild
// (`questId: null, guildId: null`) — every scenario in this file reserves that way except the
// quest/guild-partitioning tests, which pass their own `evidencePath` into stageBoot() instead.
const UNOWNED_EVIDENCE_PATH_VALUE = `${ROOT_PATH_VALUE}/unowned/instances/inst_${MINTED_UUID_VALUE.split('-').join('')}`;
// laneSpecHashBroker's real sha256 digest of laneSpecFindBrokerProxy's own sticky default spec
// (the single headless api process staged above) — every test in this file that never calls
// stageLaneSpec resolves the SAME real hash here, since the hash is pure content addressing.
const DEFAULT_SPEC_HASH_VALUE = 'd710f23b94181fa9168a01db4dfc9a25bd0a4dd95887c301d34ca3bb51931583';
const FIRST_PORT_VALUE = 40_000;
const SECOND_PORT_VALUE = 40_001;
// this broker's own nowMsForStaleness (1) + capacityReadBroker's own clock read (1) +
// instanceReserveBroker's reservedAtMs (1) +
// registryLockAcquireBroker's startedAtMs/nowMs (2) + this broker's own lockWaitStartedAtMs (1) +
// bootLockAcquireBroker's startedAtMs/nowMs (2) + this broker's own lockWaitEndedAtMs (1) +
// bootStartedAtMs (1) — every Date.now() call the real broker makes before the poll layer's own
// first deadline check, on a registry with no stale entries (a stale reap adds more, internal to
// instanceKillBroker, ahead of all of these).
const DATE_NOW_CALLS_BEFORE_POLL_CHECK = 10;
// Same count, minus the two calls made AFTER this broker's own lockWaitEndedAtMs (bootStartedAtMs
// and the poll's own check) — the position queuedMs's second bracket (lockWaitEndedAtMs) lands on.
const DATE_NOW_CALLS_BEFORE_QUEUED_MS_END = 8;
// The machine every scenario runs on unless it says otherwise: room for the whole policy pool.
const MB_BYTES = 1_048_576;
const ROOMY_FREE_MEM_MB = 16_000;
const ROOMY_TOTAL_MEM_MB = 32_000;
const ROOMY_CORE_COUNT = 8;
const IDLE_LOAD_AVG = [0, 0, 0] as const;
const DISK_BAVAIL_BLOCKS = 41_000;
const VMSTAT_CONTENT_VALUE = 'nr_free_pages 12345\noom_kill 0\n';
// Every read of registry.json BEFORE the reservation lands: this broker's own count and capacity's.
// A stale reap adds the kill's read and the release's read, queued by setupStaleReap.
const PRE_RESERVE_REGISTRY_READS = 2;
const STALE_REAP_REGISTRY_READS = 2;
// The instant a failed boot's reservation release stamps as `killedAtMs`.
const RELEASED_AT_MS = 1_700_000_000_000;

const ROOT_PATH_FILE = ROOT_PATH_VALUE;
const LINK_PATH_FILE = LINK_PATH_VALUE;
const HOME_PATH = HOME_PATH_VALUE;

export const instanceStartBrokerProxy = (): {
  setupHappyBoot: (params: {
    instanceId: InstanceId;
    evidencePath: string;
    registry: Registry;
    idleTimeoutMs?: number;
  }) => void;
  setupHappyBootWithQueuedMs: (params: {
    instanceId: InstanceId;
    evidencePath: string;
    registry: Registry;
    startedAtMs: number;
    queuedMs: number;
  }) => void;
  setupBootNeverAnswers: (params: {
    instanceId: InstanceId;
    evidencePath: string;
    registry: Registry;
    nowMs: number;
  }) => void;
  setupBootFailureMarkerAppears: (params: {
    instanceId: InstanceId;
    evidencePath: string;
    registry: Registry;
    driverMessage: string;
  }) => void;
  stageBootLockAcquireFailsWithReadError: (params: { registry: Registry }) => void;
  stageInstanceReleaseWriteFails: (params: { code: string }) => void;
  setupBootLockPid: (params: { pid: number }) => void;
  stageSeedFails: () => void;
  getWrittenBootLock: () => unknown;
  getRegistryAndBootLockWriteOrder: () => readonly unknown[];
  getBootLockReleasedPaths: () => unknown[];
  getLastRegistryWriteContent: () => unknown;
  getStderrMessages: () => readonly string[];
  getDriverSpawnCountFor: (params: { instanceId: InstanceId }) => number;
  mintInstanceId: () => InstanceId;
  setupStaleReap: (params: { staleInstanceId: InstanceId }) => void;
  setupClock: (params: { nowMs: number }) => void;
  stageLaneSpec: (params: { processes: readonly DevServerE2eProcess[] }) => void;
  stageProcessReachable: (params: { url: string }) => void;
  stageProcessUnreachable: (params: { url: string }) => void;
  setupCapacityShortOfMemory: (params: {
    peakMB: number;
    steadyMB: number;
    freeMemMB: number;
  }) => void;
  getKillConnectionCountFor: (params: { instanceId: InstanceId }) => number;
  stageShutdownReasonWriteSucceeds: (params: { evidencePath: string }) => void;
  getWrittenShutdownReason: (params: { evidencePath: string }) => unknown;
  getLeaseForInstance: (params: {
    instanceId: string;
  }) => { tool: string; label: string; ownerPid: number; state: string } | undefined;
} => {
  const leaseTakeProxy = leaseTakeBrokerProxy();
  const { database: leaseDatabase } = leaseTakeProxy.setupDatabase({ homeDir: HOME_DIR_VALUE });
  registryUpdateBrokerProxy();

  // Composed (not phantom) — this file stages its own branch answer and port candidates through
  // reserveProxy's own semantic methods below, rather than through a one-shot stub any of these
  // would otherwise queue onto a shared mock.
  const reserveProxy = instanceReserveBrokerProxy();
  // instanceReserveBroker now reads the real git branch through @dungeonmaster/bin/git's
  // currentBranch, which — unlike the adapter it replaces — has no constructor-time default and
  // throws on an unaddressed call. No test in this file asserts on `branch`, so this stages the
  // same "no branch" answer the old adapter's proxy defaulted to implicitly.
  reserveProxy.setupBranch({ branch: null });
  // instanceReleaseBroker (called on every failed-boot path) runs real registryUpdateBroker
  // underneath, against the same registry mocks reserveProxy.setupRegistry stages.
  const releaseProxy = instanceReleaseBrokerProxy();
  const registryReadProxy = registryReadBrokerProxy();
  const capacityProxy = capacityReadBrokerProxy({ database: leaseDatabase });
  const bootLockAcquireProxy = bootLockAcquireBrokerProxy();
  const bootLockReleaseProxy = bootLockReleaseBrokerProxy();
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
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — this
  // broker's own five joins (driver log, throwaway home, api log, web log) and every join a
  // composed child proxy resolves transitively all share it.
  const realPath = requireActual<{ join: typeof join }>({
    module: 'path',
  });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const profileBootRecordProxy = profileBootRecordBrokerProxy();
  // Constructed for enforce-proxy-child-creation: instanceStartBroker now calls
  // shutdownReasonWriteBroker directly too (a seed failure's own reason), even though every actual
  // write in this file's tests still goes through killProxy's own composed instance of this same
  // proxy — registerMock dedups the underlying writeFile mock by function reference regardless of
  // which composition constructed it.
  shutdownReasonWriteBrokerProxy();
  // recipeSeedRunBroker runs for real; its cwd is the sticky one this file already stages, so only
  // the package's presence under that repo root is staged (stageSeedFails).
  const recipeSeedProxy = recipeSeedRunBrokerProxy();
  // instanceStartBroker's opportunistic stale-reap calls instanceKillBroker directly (chunk-2
  // plan: "cleanup will call the same broker" — kill IS the reap primitive), so its proxy is a
  // real child-proxy composition, not a phantom one, and its OWN setupDriverUnreachableNoPgids
  // is what setupStaleReap below reaches for instead of hand-building the socket/registry-pgids/rm
  // mocks a second time.
  const killProxy = instanceKillBrokerProxy({ database: leaseDatabase });

  const openFdProxy = openForAppendSyncProxy();
  const spawnProxy = spawnDetachedProxy();
  const cliBinProxy = packageBinResolveBrokerProxy();
  cliBinProxy.setupManifestInRunRoot({
    packageName: CLI_PACKAGE_NAME_VALUE,
    repoRoot: CWD_PATH_VALUE,
    manifestPath: CLI_MANIFEST_PATH_VALUE,
    rawManifest: CLI_RAW_MANIFEST_VALUE,
  });
  // #gateway/node/os is a raw passthrough of the Node 'os' module (no per-function wrapper, so no
  // gateway proxy to compose); `tmpdir` takes no argument, so the empty address is the honest one.
  const tmpdirHandle: MockHandle = registerMock({ fn: tmpdir });
  const pollProxy = instanceStartBootPollLayerBrokerProxy();
  const readyWaitProxy = laneReadyWaitBrokerProxy();
  const stderrRecorder = stderrProxy();
  envSnapshotProxy();

  // instanceStartBroker asks `capacity` whether the machine can hold another instance before it
  // reserves one. The default machine has room for the whole policy pool and no spec has a measured
  // profile, so that answer is permissive; the refusal cases below describe a machine of their own.
  capacityProxy.setupMachineReading({
    freeMemBytes: ROOMY_FREE_MEM_MB * MB_BYTES,
    totalMemBytes: ROOMY_TOTAL_MEM_MB * MB_BYTES,
    coreCount: ROOMY_CORE_COUNT,
    loadAvg: IDLE_LOAD_AVG,
    diskBavail: DISK_BAVAIL_BLOCKS,
    diskBsize: MB_BYTES,
    vmstatContent: VMSTAT_CONTENT_VALUE,
  });
  capacityProxy.setupNoProfile();

  registerMock({ fn: randomUUID }).calledWith([]).returns(MINTED_UUID_VALUE);
  const clockProxy = nowProxy();

  tmpdirHandle.calledWith([]).returns(TMP_DIR_VALUE);

  // instanceReserveBroker asks the OS for `claimAttempts` port-pair candidates upfront, through
  // reserveProxy's own freePortPair() staging — every scenario in this file is a machine with room
  // and no port collision, so every candidate resolves to the same fixed pair; the exact numbers
  // only need to differ from each other, never match a real free port.
  reserveProxy.setupPortCandidates({
    pairs: Array.from({ length: instanceLifecycleStatics.ports.claimAttempts }, () => ({
      api: FIRST_PORT_VALUE,
      web: SECOND_PORT_VALUE,
    })),
  });

  // The state every scenario shares: the registry as the test supplies it, and the reservation's
  // own lock, write and rename.
  // The registry every scenario stages already holds the reserved instance's own row, which the boot
  // reads back at the end. Every read before the reservation lands (this broker's own count and
  // capacity's) sees the fleet WITHOUT that row, as it does for real.
  const preReserveRegistry: { json: string | null } = { json: null };
  const stageRegistryAndLocks = ({ registry }: { registry: Registry }): void => {
    clockProxy.setupNow({ ms: 1 });
    registryReadProxy.setupPresentRegistry({ content: JSON.stringify(registry) });
    reserveProxy.setupRegistry({ json: JSON.stringify(registry) });
    const withoutOwnRow = JSON.stringify({
      ...registry,
      instances: registry.instances.filter(
        (entry) => entry.id !== InstanceIdStub({ value: MINTED_INSTANCE_ID_VALUE }),
      ),
    });
    preReserveRegistry.json = withoutOwnRow;
    Array.from({ length: PRE_RESERVE_REGISTRY_READS }).forEach(() => {
      registryReadProxy.setupPresentRegistryOnce({ content: withoutOwnRow });
    });
  };

  const stageBoot = ({
    instanceId,
    evidencePath,
    registry,
    idleTimeoutMs,
  }: {
    instanceId: InstanceId;
    evidencePath: string;
    registry: Registry;
    idleTimeoutMs?: number;
  }): void => {
    stageRegistryAndLocks({ registry });
    bootLockAcquireProxy.setupWriteSucceeds();
    // A boot that reaches the poll answering `ready` is one the DRIVER already released boot.lock
    // for itself (its own docstring) — the default here is that ordinary case, so a caller whose
    // OWN failure (a seed) runs the catch block's bootLockReleaseBroker call for the first time in
    // a happy-boot test finds no lock left to release, exactly as a real released lock reads.
    bootLockReleaseProxy.setupNoLock();
    // The link check and the repo-root config lookup every broker reads, all off one addressed
    // repo root and home.
    repoLinkProxy.setupLinkResolvesToRoot({
      repoRoot: CWD_PATH_VALUE,
      linkPath: LINK_PATH_FILE,
      homeDir: HOME_DIR_VALUE,
      homePath: HOME_PATH,
      rootPath: ROOT_PATH_FILE,
    });
    // instanceReserveBroker's own reserve step creates the instance's evidence directory before
    // this broker ever reaches a boot attempt — routed through reserveProxy's own semantic method
    // (not a bare ensureDirProxy() composed here) since instanceStartBroker.ts itself never imports
    // ensureDir; only instanceReserveBroker does.
    reserveProxy.setupEvidenceDir({
      homeDir: HOME_DIR_VALUE,
      homePath: HOME_PATH,
      rootPath: ROOT_PATH_FILE,
      evidencePath,
    });
    // The record a successful boot writes is addressed by the spec's real content hash, which is
    // the same value in every test that never calls stageLaneSpec.
    profileBootRecordProxy.setupBootRecordWrite({
      homeDir: HOME_DIR_VALUE,
      homePath: HOME_PATH,
      rootPath: ROOT_PATH_FILE,
      profilesPath: `${ROOT_PATH_VALUE}/profiles/${DEFAULT_SPEC_HASH_VALUE}`,
      instanceId,
      nowMs: 1,
    });

    // packageBinResolveBroker takes dirname() of the manifest it resolved; the one path this
    // scenario walks is staged as an exact-address real passthrough.
    registerMock({ fn: dirname })
      .calledWith([CLI_MANIFEST_PATH_VALUE])
      .implement(requireActual<{ dirname: typeof dirname }>({ module: 'path' }).dirname);

    const driverLogPath = `${evidencePath}/driver.log`;
    openFdProxy.returns({ path: driverLogPath, fd: 17 });

    spawnProxy.setupSuccess({
      command: execPath,
      args: [
        CLI_BIN_PATH_VALUE,
        'siegelense',
        'driver',
        '--instance',
        instanceId,
        ...(idleTimeoutMs === undefined ? [] : ['--idle-timeout-ms', String(idleTimeoutMs)]),
      ],
      // The driver runs in the repo root the caller named, whatever this process's own cwd is.
      cwd: CWD_PATH_VALUE,
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

      const socketPath = `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`;
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
      evidencePath: string;
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
        clockProxy.setupNowOnce({ ms: startedAtMs });
      });
      clockProxy.setupNowOnce({ ms: startedAtMs + queuedMs });

      const socketPath = `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`;
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
          clockProxy.setupNowOnce({ ms: nowMs });
        },
      );

      const socketPath = `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`;
      const evidencePathAbs = evidencePath;
      pollProxy.setupNeverAnswers({
        socketPath,
        evidencePath: evidencePathAbs,
        nowMs,
        deadlineMs: nowMs + driverStatics.boot.defaultTimeoutMs,
      });

      bootLockReleaseProxy.setupLockHeldBy({
        heldBy: instanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: nowMs,
      });

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
        homePath: `${TMP_DIR_VALUE}/dm-siege-${instanceId}`,
      });
      releaseProxy.setupNow({ nowMs: RELEASED_AT_MS });
    },

    setupBootFailureMarkerAppears: ({
      instanceId,
      evidencePath,
      registry,
      driverMessage,
    }: {
      instanceId: InstanceId;
      evidencePath: string;
      registry: Registry;
      driverMessage: string;
    }): void => {
      stageBoot({ instanceId, evidencePath, registry });

      const socketPath = `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`;
      const evidencePathAbs = evidencePath;
      pollProxy.setupFailureMarkerAppears({
        socketPath,
        evidencePath: evidencePathAbs,
        marker: BootFailureMarkerStub({ message: driverMessage }),
      });

      // The driver never got as far as writing a boot lock in this scenario either — it dies
      // before laneBootBroker's own success path stamps anything — so releasing boot.lock reads
      // the same acquired-by-this-instance shape the timeout path above stages.
      bootLockReleaseProxy.setupLockHeldBy({
        heldBy: instanceId,
        heldByPid: 'proc-12345',
        acquiredAtMs: 1,
      });

      // Same reasoning as setupBootNeverAnswers above: the catch's instanceKillBroker call falls
      // to the orphan-reap path against a socket that never answered, and a driver that died
      // before ever finishing its boot never wrote a heartbeat naming any pgids either.
      killProxy.setupDriverUnreachableNoPgids({
        socketPath,
        homePath: `${TMP_DIR_VALUE}/dm-siege-${instanceId}`,
      });
      releaseProxy.setupNow({ nowMs: RELEASED_AT_MS });
    },

    getWrittenBootLock: (): unknown => bootLockAcquireProxy.getWrittenLock(),

    getRegistryAndBootLockWriteOrder: (): readonly unknown[] =>
      reserveProxy.getRegistryWritePathsInOrder({ alongside: BOOT_LOCK_PATH_VALUE }),

    getBootLockReleasedPaths: (): unknown[] => bootLockReleaseProxy.getDeletedPaths(),

    getLastRegistryWriteContent: (): unknown => reserveProxy.getWrittenRegistry(),

    getStderrMessages: (): readonly string[] =>
      stderrRecorder.getWrites().map((chunk) => String(chunk)),

    // Counts the spawns that match the FULL address: node as the run root resolved it, the repo
    // root's own CLI bin script, this instance's driver argv, and `cwd` = the repo root.
    getDriverSpawnCountFor: ({ instanceId }: { instanceId: InstanceId }): number =>
      spawnProxy.getSpawnedOptions({
        command: execPath,
        args: [CLI_BIN_PATH_VALUE, 'siegelense', 'driver', '--instance', instanceId],
        cwd: CWD_PATH_VALUE,
      }).length,

    mintInstanceId: (): InstanceId => InstanceIdStub({ value: MINTED_INSTANCE_ID_VALUE }),

    stageLaneSpec: ({ processes }: { processes: readonly DevServerE2eProcess[] }): void => {
      laneSpecFindProxy.setupConfiguredProcesses({ processes });
    },

    stageProcessReachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupReachable({ url });
    },

    stageProcessUnreachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupUnreachable({ url });
    },

    // A measured `api` profile and a machine whose free memory less headroom cannot hold its peak:
    // capacity's own arithmetic answers `suggested: 0` and renders the `why` the refusal carries.
    setupCapacityShortOfMemory: ({
      peakMB,
      steadyMB,
      freeMemMB,
    }: {
      peakMB: number;
      steadyMB: number;
      freeMemMB: number;
    }): void => {
      capacityProxy.setupMachineReading({
        freeMemBytes: freeMemMB * MB_BYTES,
        totalMemBytes: ROOMY_TOTAL_MEM_MB * MB_BYTES,
        coreCount: ROOMY_CORE_COUNT,
        loadAvg: IDLE_LOAD_AVG,
        diskBavail: DISK_BAVAIL_BLOCKS,
        diskBsize: MB_BYTES,
        vmstatContent: VMSTAT_CONTENT_VALUE,
      });
      capacityProxy.setupProfile({
        profile: SpecProfileStub({
          samples: [{ poolSize: capacityStatics.policy.ceiling, steadyMB, peakMB, runs: 1 }],
        }),
      });
    },

    // Replaces the sticky clock every scenario stages at 1 — for a scenario that needs a past
    // instant (a heartbeat or reservation older than its window) a clock of 1 cannot express.
    // Call it AFTER setupHappyBoot and setupStaleReap, which stage the clock themselves.
    setupClock: ({ nowMs }: { nowMs: number }): void => {
      clockProxy.setupNow({ ms: nowMs });
    },

    setupStaleReap: ({ staleInstanceId }: { staleInstanceId: InstanceId }): void => {
      const staleSocketPath = `${TMP_DIR_VALUE}/dm-siege-sockets/${staleInstanceId}.sock`;
      const staleHomePath = `${TMP_DIR_VALUE}/dm-siege-${staleInstanceId}`;

      killProxy.setupDriverUnreachableNoPgids({
        socketPath: staleSocketPath,
        homePath: staleHomePath,
      });
      // The kill and the release each read the registry before the reservation lands too.
      const withoutOwnRow = preReserveRegistry.json;
      if (withoutOwnRow !== null) {
        Array.from({ length: STALE_REAP_REGISTRY_READS }).forEach(() => {
          registryReadProxy.setupPresentRegistryOnce({ content: withoutOwnRow });
        });
      }
    },

    // Bypasses bootLockAcquireBroker's real polling/takeover logic entirely: the exclusive create
    // loses to a file already there (EEXIST, the broker's own first move on every call), and the
    // read that classifies that failure fails for a reason that has nothing to do with absence —
    // the ONE branch that throws immediately, with no retry and no Date.now() sequencing to stage.
    stageBootLockAcquireFailsWithReadError: ({ registry }: { registry: Registry }): void => {
      stageRegistryAndLocks({ registry });
      // Same reasoning as stageBoot's own evidence-dir stage: reserve creates the instance's
      // evidence directory before boot-lock-acquire ever runs. This scenario takes no
      // evidencePath param (it never reaches a boot attempt), so it addresses the one fixed
      // "unowned" value every caller of this method reserves against.
      reserveProxy.setupEvidenceDir({
        homeDir: HOME_DIR_VALUE,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH_FILE,
        evidencePath: UNOWNED_EVIDENCE_PATH_VALUE,
      });
      // EMFILE, not ENOENT: a read that fails for a reason other than absence, which the acquire
      // must throw rather than read as a released lock.
      bootLockAcquireProxy.setupLockReadFailsForNonAbsenceReason();
    },

    // The reservation's own registry write lands, then every write the failed boot's cleanup makes
    // (the kill's release, then the fallback release it falls to) is refused, so the release itself
    // throws while the boot error is still the one the caller sees. The staged writes are one-shot
    // and consumed in the order the broker makes them.
    stageInstanceReleaseWriteFails: ({ code }: { code: string }): void => {
      reserveProxy.stageNextRegistryWriteSucceeds();
      releaseProxy.stageNextRegistryWriteFails({ code });
      releaseProxy.stageNextRegistryWriteFails({ code });
    },

    setupBootLockPid: ({ pid }: { pid: number }): void => {
      bootLockAcquireProxy.setupPid({ pid });
    },

    // The recipes package is absent under the staged repo root, so the real recipesLocateBroker
    // throws its own RecipesPackageMissingError.
    stageSeedFails: (): void => {
      recipeSeedProxy.bookMissingUnder({ repoRoot: CWD_PATH_VALUE });
    },

    getKillConnectionCountFor: ({ instanceId }: { instanceId: InstanceId }): number =>
      killProxy.getConnectionCountFor({
        socketPath: `${TMP_DIR_VALUE}/dm-siege-sockets/${instanceId}.sock`,
      }),

    stageShutdownReasonWriteSucceeds: ({ evidencePath }: { evidencePath: string }): void => {
      killProxy.setupShutdownReasonWriteSucceeds({
        evidencePath,
      });
    },

    getWrittenShutdownReason: ({ evidencePath }: { evidencePath: string }): unknown =>
      killProxy.getWrittenShutdownReason({
        evidencePath,
      }),

    getLeaseForInstance: ({
      instanceId,
    }: {
      instanceId: string;
    }): { tool: string; label: string; ownerPid: number; state: string } | undefined => {
      const row = leaseDatabase
        .prepare('SELECT tool, label, owner_pid, state FROM leases WHERE label = ?;')
        .get(instanceId) as
        { tool: string; label: string; owner_pid: number; state: string } | undefined;
      return row
        ? {
            tool: row.tool,
            label: row.label,
            ownerPid: row.owner_pid,
            state: row.state,
          }
        : undefined;
    },
  };
};
