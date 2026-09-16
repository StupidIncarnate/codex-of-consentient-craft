import { existsSync } from 'fs';
import { access, readFile, realpath, rename, unlink, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';
import { createServer } from 'net';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import {
  cwdResolveBrokerProxy,
  pathJoinAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FilePathStub,
  NetworkPortStub,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { FilePath, NetworkPort, TimeoutMs } from '@dungeonmaster/shared/contracts';

import { instanceReleaseBrokerProxy } from '../release/instance-release-broker.proxy';
import { instanceReserveBrokerProxy } from '../reserve/instance-reserve-broker.proxy';
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
import type { LaneSpecStub } from '../../../contracts/lane-spec/lane-spec.stub';
import type { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { laneSpecStatics } from '../../../statics/lane-spec/lane-spec-statics';

type InstanceId = ReturnType<typeof InstanceIdStub>;
type Registry = ReturnType<typeof RegistryStub>;
type SpecName = ReturnType<typeof SpecNameStub>;
type LaneSpec = ReturnType<typeof LaneSpecStub>;

// Every path below is REAL `path.join` output off two sticky roots (os.homedir() and
// processCwdAdapter()'s own built-in default) — never a one-shot `pathJoinAdapter.returns()`.
// instanceReserveBroker, bootLockAcquireBroker and every registry broker they compose ALSO
// resolve their own paths through the SAME real pathJoinAdapter passthrough, so one sticky root
// answers every caller consistently regardless of how many times each resolver runs — a one-shot
// queue shared across a dozen unrelated resolvers has no such guarantee (the wrong call consumes
// the wrong entry the moment two callers interleave).
const HOME_DIR_VALUE = '/home/user';
const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const REGISTRY_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json`;
const REGISTRY_TMP_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.json.tmp`;
const REGISTRY_LOCK_PATH_VALUE = `${ROOT_PATH_VALUE}/registry.lock`;
const BOOT_LOCK_PATH_VALUE = `${ROOT_PATH_VALUE}/boot.lock`;
const CWD_PATH_VALUE = '/default/cwd';
const CONFIG_FILE_PATH_VALUE = `${CWD_PATH_VALUE}/.dungeonmaster.json`;
const LINK_PATH_VALUE = `${CWD_PATH_VALUE}/.siegelense`;
const TMP_DIR_VALUE = '/tmp';
// cliPackageBinResolveAdapter resolves @dungeonmaster/cli's package root through a REAL
// require.resolve() call (never mocked — see cliPackageBinResolveAdapterProxy's own comment).
const CLI_BIN_RELATIVE_VALUE = './dist/bin/dungeonmaster.js';
const MINTED_UUID_VALUE = '7f3a9c21-58cc-4372-a567-0e02b2c3d479';
const FIRST_PORT_VALUE = 40_000;
const SECOND_PORT_VALUE = 40_001;
const PORT_ROLE_TOGGLE_DIVISOR = 2;
// boot-lock-acquire-broker.proxy.ts and boot-lock-release-broker.proxy.ts each pre-stage their
// OWN one-shot pathJoin/homedir resolutions unconditionally in their constructors (never gated
// behind a semantic setup method) — 4 rounds of {homedir-join, root-join, bootlock-join} for
// acquire, 1 round for release, 15 pathJoin one-shots total. enforce-proxy-child-creation requires
// BOTH proxies be constructed here even though this file never calls their setup methods, so those
// one-shots sit queued ahead of every real call this test drives. Draining well past that count
// empties the queue back to pathJoinAdapterProxy's own sticky real-passthrough default, which every
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
  getWriteOrder: () => readonly FilePath[];
  getBootLockReleasedPaths: () => unknown[];
  getLastRegistryWriteContent: () => unknown;
  getStderrMessages: () => readonly ReturnType<typeof ContentTextStub>[];
  mintInstanceId: () => InstanceId;
  setupStaleReap: (params: { staleInstanceId: InstanceId }) => void;
  stageLaneSpec: (params: { specName: SpecName; spec: LaneSpec }) => void;
  stageProcessReachable: (params: { url: string }) => void;
  stageProcessUnreachable: (params: { url: string }) => void;
} => {
  // Created to satisfy enforce-proxy-child-creation; their onceFor-based semantic setup methods
  // are never called, since every path here resolves through the REAL pathJoin passthrough (see
  // the note above) rather than through a one-shot stub any of these would queue.
  instanceReserveBrokerProxy();
  // instanceReleaseBroker (called on every failed-boot path, defect 2) composes real
  // registryUpdateBroker underneath — the SAME generic writeFile/readFile mocks staged below
  // already satisfy it, matching how instanceReserveBroker's own registryUpdateBroker call runs
  // real against these identical mocks.
  instanceReleaseBrokerProxy();
  registryReadBrokerProxy();
  bootLockAcquireBrokerProxy();
  bootLockReleaseBrokerProxy();
  locationsInstanceEvidencePathFindBrokerProxy();
  locationsRepoLinkPathFindBrokerProxy();
  locationsSocketPathFindBrokerProxy();
  laneSpecFindBrokerProxy();
  laneSpecHashBrokerProxy();
  cwdResolveBrokerProxy();
  pathJoinAdapterProxy();
  // instanceStartBroker's opportunistic stale-reap calls instanceKillBroker directly (chunk-2
  // plan: "cleanup will call the same broker" — kill IS the reap primitive), so its proxy is a
  // real child-proxy composition, not a phantom one, and its OWN setupDriverUnreachableNoHeartbeat
  // is what setupStaleReap below reaches for instead of hand-building the socket/heartbeat/rm
  // mocks a second time.
  const killProxy = instanceKillBrokerProxy();

  const openFdProxy = fsOpenFdAdapterProxy();
  const spawnProxy = childProcessSpawnDetachedAdapterProxy();
  const cliBinProxy = cliPackageBinResolveAdapterProxy();
  cliBinProxy.manifestDeclaresBin({ binRelative: CLI_BIN_RELATIVE_VALUE });
  const tmpdirProxy = osTmpdirAdapterProxy();
  const pollProxy = instanceStartBootPollLayerBrokerProxy();
  const readyWaitProxy = laneReadyWaitBrokerProxy();
  const cwdProxy = processCwdAdapterProxy();
  const stderrHandle = registerSpyOn({ object: process.stderr, method: 'write' });

  const existsHandle: MockHandle = registerMock({ fn: existsSync });
  const readHandle: MockHandle = registerMock({ fn: readFile });
  const writeHandle: MockHandle = registerMock({ fn: writeFile });
  const unlinkHandle: MockHandle = registerMock({ fn: unlink });
  const realpathHandle: MockHandle = registerMock({ fn: realpath });
  const renameHandle: MockHandle = registerMock({ fn: rename });
  const accessHandle: MockHandle = registerMock({ fn: access });
  const createServerHandle: MockHandle = registerMock({ fn: createServer });

  registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(MINTED_UUID_VALUE);
  const dateNowHandle = registerSpyOn({ object: Date, method: 'now' });
  dateNowHandle.calledWith([]).returns(EpochMsStub().valueOf());
  registerMock({ fn: homedir }).calledWith([]).returns(HOME_DIR_VALUE);

  tmpdirProxy.returns({ path: TMP_DIR_VALUE });
  cwdProxy.returns({ path: CWD_PATH_VALUE });
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
  // registryLockReleaseBroker unlinks unconditionally once registryUpdateBroker's write finishes
  // (no heldBy check, unlike boot.lock's release) — staged sticky for every happy-path reserve.
  unlinkHandle.calledWith([REGISTRY_LOCK_PATH_ABS]).resolves(undefined);
  renameHandle.calledWith([REGISTRY_TMP_PATH_ABS]).resolves(undefined);

  // net.createServer() takes no args — [] is the address. Two calls per port-pair request (api
  // then web), so an odd/even counter is what keeps every pair's two members distinct; the exact
  // numbers only need to differ, never match a real free port.
  const firstPort = NetworkPortStub({ value: FIRST_PORT_VALUE });
  const secondPort = NetworkPortStub({ value: SECOND_PORT_VALUE });
  const portCallState = { count: 0 };
  createServerHandle.calledWith([]).implement(() => {
    const isFirst = portCallState.count % PORT_ROLE_TOGGLE_DIVISOR === 0;
    portCallState.count += 1;
    const port: NetworkPort = isFirst ? firstPort : secondPort;
    return {
      listen: (_listenPort: number, callback: () => void): void => {
        callback();
      },
      close: (callback: () => void): void => {
        callback();
      },
      address: (): { port: NetworkPort } => ({ port }),
      on: (): undefined => undefined,
    } as never;
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

    // Computed AFTER the drain above, for the same reason the drain exists at all: `join` is
    // globally mocked as a one-shot QUEUE (pathJoinAdapterProxy), and a call made before the
    // queue is drained steals an entry staged for an unrelated caller instead of reaching the
    // sticky real-passthrough default. Must mirror the real cliPackageBinResolveAdapter's own
    // require.resolve('@dungeonmaster/cli') + join(dirname(...), ...) exactly.
    const expectedDriverBinPath = join(
      dirname(require.resolve('@dungeonmaster/cli')),
      CLI_BIN_RELATIVE_VALUE,
    );

    readHandle.calledWith([REGISTRY_PATH_ABS]).resolves(JSON.stringify(registry));

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

  // `laneSpecStatics.specs` is typed `as const` (readonly at the TYPE level only — nothing here
  // freezes it at runtime), and `laneSpecFindBroker` itself reads through this SAME widened-type
  // alias rather than `Reflect.set` (confined to *-guard.ts/*-contract.ts) to register the value a
  // test builds. Adding a NEW key here — never overwriting 'dungeonmaster-web' or
  // 'dungeonmaster-headless' — keeps every OTHER test's use of the real built-ins untouched
  // regardless of run order within this file.
  const registerLaneSpec = ({ specName, spec }: { specName: SpecName; spec: LaneSpec }): void => {
    const mutableSpecs: Record<SpecName, LaneSpec> = laneSpecStatics.specs;
    mutableSpecs[specName] = spec;
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

    stageLaneSpec: ({ specName, spec }: { specName: SpecName; spec: LaneSpec }): void => {
      registerLaneSpec({ specName, spec });
    },

    stageProcessReachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupReachable({ url });
    },

    stageProcessUnreachable: ({ url }: { url: string }): void => {
      readyWaitProxy.setupUnreachable({ url });
    },

    setupStaleReap: ({ staleInstanceId }: { staleInstanceId: InstanceId }): void => {
      const staleSocketPath = AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/dm-siege-sockets/${staleInstanceId}.sock`,
      });
      const staleEvidencePath = `${ROOT_PATH_VALUE}/unowned/instances/${staleInstanceId}`;
      const staleHeartbeatPath = AbsoluteFilePathStub({
        value: `${staleEvidencePath}/heartbeat.json`,
      });
      const staleHomePath = AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/dm-siege-${staleInstanceId}`,
      });

      killProxy.setupDriverUnreachableNoHeartbeat({
        socketPath: staleSocketPath,
        heartbeatPath: staleHeartbeatPath,
        homePath: staleHomePath,
      });
    },
  };
};
