/**
 * PURPOSE: Spawns and tracks N real siegelense drivers against a real lane spec — every call here
 * reaches the SAME production brokers `start`/`kill` reach (`instanceStartBroker`, `instanceKillBroker`),
 * never a mock, because the whole point of the teardown suite this backs is that a leak-guard which
 * mocks the process table proves nothing (siegelense-tooling.md line 1368). `afterAll` reaps every
 * instance this harness booted, by PGID first (defense in depth against a boot that never returned a
 * clean `InstanceManifest`) and then through `instanceKillBroker` — so a failing assertion never
 * leaves a server, a socket or a port pair behind for the next suite to trip over.
 *
 * USAGE:
 * const fleet = driverFleetHarness();
 * fleet.ensureHomeReady({ home: testbed.guildPath });
 * fleet.configureApiLane({ configDir: testbed.guildPath });
 * process.chdir(testbed.guildPath); // laneSpecFindBroker resolves .dungeonmaster.json off cwd
 * const manifest = await fleet.boot({ specName: 'api' });
 * const entry = await fleet.registryEntry({ instanceId: manifest.instanceId });
 * const result = await fleet.killViaBroker({ instanceId: manifest.instanceId });
 * // fleet.afterAll() reaps anything still alive when the suite ends
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from '#gateway/node/fs';
import { isPortFree as probePortFree } from '#gateway/node/net';
import { kill, setEnv, stderr } from '#gateway/node/process';
import { join, resolve as resolvePath } from '#gateway/node/path';
import { setTimeout } from '#gateway/node/setTimeout';

import type { SiegeInstance } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { configDefaultsStatics } from '@dungeonmaster/config';
import { DungeonmasterConfigStub } from '@dungeonmaster/config/contracts/dungeonmaster-config/dungeonmaster-config.stub';
import { DevServerE2eProcessStub } from '@dungeonmaster/config/contracts/dev-server-e2e-process/dev-server-e2e-process.stub';

import { instanceKillBroker } from '../../../src/brokers/instance/kill/instance-kill-broker';
import { instanceStartBroker } from '../../../src/brokers/instance/start/instance-start-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../../src/brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsInstanceHomePathFindBroker } from '../../../src/brokers/locations/instance-home-path-find/locations-instance-home-path-find-broker';
import { registryReadBroker } from '../../../src/brokers/registry/read/registry-read-broker';
import { shutdownReasonReadBroker } from '../../../src/brokers/shutdown-reason/read/shutdown-reason-read-broker';
import { driverSocketRequestBroker } from '../../../src/brokers/driver/socket-request/driver-socket-request-broker';
import { processIsAliveBroker } from '../../../src/brokers/process/is-alive/process-is-alive-broker';
import { processKillGroupBroker } from '../../../src/brokers/process/kill-group/process-kill-group-broker';
import { DriverRequestStub } from '../../../src/contracts/driver-request/driver-request.stub';
import type { InstanceManifest } from '../../../src/contracts/instance-manifest/instance-manifest-contract';
import type { KillResult } from '../../../src/contracts/kill-result/kill-result-contract';
import type { RegistryEntry } from '../../../src/contracts/registry-entry/registry-entry-contract';
import { driverStatics } from '../../../src/statics/driver/driver-statics';

// How often waitForHeartbeatPgids re-checks the file. instanceLifecycleStatics.heartbeat.intervalMs
// (5000ms) is the ticker's own cadence, so polling at a fraction of it catches the first beat
// promptly without hammering the filesystem.
const HEARTBEAT_POLL_MS = 500;

// siegelense itself knows nothing about Claude or ward — this repo's own `devServer.e2e.processes`
// names CLAUDE_CLI_PATH/WARD_CLI_PATH in the api process's own `env` (D4), so a real boot of THIS
// repo already resolves both against these two fixtures without this harness's help. These two
// lines are a fallback for a checkout whose `.dungeonmaster.json` has not picked that up yet: a
// real Claude/ward run spends real API usage and produces a non-deterministic reading, which is
// exactly what this teardown suite's measurements cannot tolerate. Neither fixture ships in this
// package's published `dist/`, so there is no locationsStatics home for either path — same
// reasoning as siege-lane.ts, which resolves the identical two binaries the identical way.
// instanceStartBroker spawns the driver with no `env` override, so the driver inherits
// process.env from THIS jest worker: setting these here, before any fleet.boot() call, is what
// the spawned driver — and the api process ITS OWN laneBootBroker call spawns in turn — sees, as
// the INHERITED env a repo-config value would still override.
const FAKE_CLAUDE_CLI_PATH = resolvePath(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'web',
  'test',
  'harnesses',
  'claude-mock',
  'bin',
  'claude',
);
const FAKE_WARD_CLI_PATH = resolvePath(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'orchestrator',
  'test-fixtures',
  'fake-ward-bin',
  'dungeonmaster-ward',
);

// This checkout's own root — one level above `packages/`. `configureApiLane` writes a
// `.dungeonmaster.json` into an isolated OS-tmp testbed dir, never this repo's own (another agent
// may be rewriting that file concurrently, and a consumer's config is not a test fixture), so the
// configured command has to `cd` here itself before it can reach `npm run dev:no-watch` — the
// driver spawns it with its cwd resolved off the TESTBED dir, not off this repo.
const REPO_ROOT = resolvePath(__dirname, '..', '..', '..', '..', '..');

export const driverFleetHarness = (): {
  ensureHomeReady: (params: { home: string }) => void;
  configureApiLane: (params: { configDir: string }) => void;
  boot: (params: { specName: string; idleTimeoutMs?: number }) => Promise<InstanceManifest>;
  killViaBroker: (params: { instanceId: SiegeInstance['id'] }) => Promise<KillResult>;
  sigkillDriverPid: (params: { pid: string }) => void;
  registryEntry: (params: {
    instanceId: SiegeInstance['id'];
  }) => Promise<RegistryEntry | undefined>;
  pingSocket: (params: { instanceId: SiegeInstance['id'] }) => Promise<boolean>;
  isGroupAlive: (params: { pgid: number }) => boolean;
  isPortFree: (params: { port: number }) => Promise<boolean>;
  heartbeatPgids: (params: { instanceId: SiegeInstance['id'] }) => readonly number[];
  heartbeatExists: (params: { instanceId: SiegeInstance['id'] }) => boolean;
  waitForHeartbeatPgids: (params: {
    instanceId: SiegeInstance['id'];
    deadlineMs: number;
  }) => Promise<readonly number[]>;
  waitForDriverProcessExit: (params: { pid: string; deadlineMs: number }) => Promise<boolean>;
  waitForGroupsDead: (params: { pgids: readonly number[]; deadlineMs: number }) => Promise<boolean>;
  waitForShutdownReason: (params: {
    instanceId: SiegeInstance['id'];
    deadlineMs: number;
  }) => Promise<boolean>;
  evidenceDirExists: (params: { instanceId: SiegeInstance['id'] }) => boolean;
  apiLogExists: (params: { instanceId: SiegeInstance['id'] }) => boolean;
  homeDirExists: (params: { instanceId: SiegeInstance['id'] }) => boolean;
  afterAll: () => Promise<void>;
} => {
  const trackedInstanceIds = new Set<SiegeInstance['id']>();

  // Stopgap for a confirmed, separately-owned gap: a fresh DUNGEONMASTER_HOME has no `siegelense/`
  // directory yet — `dungeonmaster init`'s InstallLinkCreateResponder is what normally creates it,
  // and this harness's isolated testbed home never runs init. Without this, the very first registry
  // lock acquire fails with a raw ENOENT before any instance-lifecycle code runs at all.
  const ensureHomeReady = ({ home }: { home: string }): void => {
    mkdirSync(`${home}/siegelense`, { recursive: true });
  };

  // Writes a `.dungeonmaster.json` naming ONE real `api` process — this checkout's own
  // `dev:no-watch` server command, `cd`-anchored at `REPO_ROOT` so it runs correctly regardless of
  // the driver's own cwd. `{apiPort}` is the one placeholder `laneBootBroker` must substitute for a
  // boot to answer its readyPath; every other var (DUNGEONMASTER_HOME, CLAUDE_CLI_PATH,
  // WARD_CLI_PATH) already reaches the spawned server through inherited env — see `boot()`'s own
  // comment on why setting them here would be redundant.
  const configureApiLane = ({ configDir }: { configDir: string }): void => {
    const config = DungeonmasterConfigStub({
      framework: 'monorepo',
      devServer: {
        devCommand: 'npm run dev',
        // Required by the contract, unread by anything this harness drives — the real per-run
        // port always comes from a freshly claimed PortPair, never this field (see 3.3 of
        // scrolls/siegelense-consumer-lanes.md).
        port: configDefaultsStatics.devServer.port.default,
        e2e: {
          processes: [
            DevServerE2eProcessStub({
              name: 'api',
              command: `cd "${REPO_ROOT}" && npm run dev:no-watch --workspace=@dungeonmaster/server`,
              portRole: 'api',
              readyPath: '/api/guilds',
              env: { DUNGEONMASTER_PORT: '{apiPort}' },
            }),
          ],
        },
      },
    });

    writeFileSync(`${configDir}/.dungeonmaster.json`, JSON.stringify(config));
  };

  const evidenceDir = ({ instanceId }: { instanceId: SiegeInstance['id'] }): string =>
    locationsInstanceEvidencePathFindBroker({ instanceId, guildId: null });

  const boot = async ({
    specName,
    idleTimeoutMs,
  }: {
    specName: string;
    idleTimeoutMs?: number;
  }): Promise<InstanceManifest> => {
    // See the module-level comment on FAKE_CLAUDE_CLI_PATH/FAKE_WARD_CLI_PATH above. Set here
    // rather than in the constructor (enforce-harness-patterns bans a constructor side effect) —
    // instanceStartBroker spawns the driver with no `env` override, so the driver inherits
    // process.env from THIS jest worker at spawn time, and this assignment must land before that.
    setEnv('CLAUDE_CLI_PATH', FAKE_CLAUDE_CLI_PATH);
    setEnv('WARD_CLI_PATH', FAKE_WARD_CLI_PATH);

    const manifest = await instanceStartBroker({
      specName,
      questId: null,
      guildId: null,
      seed: null,
      ...(idleTimeoutMs === undefined ? {} : { idleTimeoutMs }),
    });
    trackedInstanceIds.add(manifest.instanceId);
    return manifest;
  };

  const killViaBroker = async ({
    instanceId,
  }: {
    instanceId: SiegeInstance['id'];
  }): Promise<KillResult> => instanceKillBroker({ instanceId });

  const sigkillDriverPid = ({ pid }: { pid: string }): void => {
    kill(Number(pid), 'SIGKILL');
  };

  const registryEntry = async ({
    instanceId,
  }: {
    instanceId: SiegeInstance['id'];
  }): Promise<RegistryEntry | undefined> => {
    const registry = await registryReadBroker();
    return registry.instances.find((candidate) => candidate.id === instanceId);
  };

  const pingSocket = async ({
    instanceId,
  }: {
    instanceId: SiegeInstance['id'];
  }): Promise<boolean> => {
    const entry = await registryEntry({ instanceId });
    const socketPath = entry?.socketPath ?? null;
    if (socketPath === null) {
      return false;
    }

    return driverSocketRequestBroker({
      socketPath,
      request: DriverRequestStub({ kind: 'ping' }),
      timeoutMs: driverStatics.socket.requestTimeoutMs,
    })
      .then((response) => response.ok)
      .catch(() => false);
  };

  const isGroupAlive = ({ pgid }: { pgid: number }): boolean => processIsAliveBroker({ pgid });

  const isPortFree = async ({ port }: { port: number }): Promise<boolean> =>
    probePortFree({ port });

  const heartbeatPgids = ({
    instanceId,
  }: {
    instanceId: SiegeInstance['id'];
  }): readonly number[] => {
    const heartbeatPath = join(evidenceDir({ instanceId }), locationsStatics.siegelense.heartbeat);

    if (!existsSync(heartbeatPath)) {
      return [];
    }

    const parsed: unknown = JSON.parse(readFileSync(heartbeatPath));
    const pgidsField =
      typeof parsed === 'object' && parsed !== null && 'pgids' in parsed
        ? (parsed as { pgids: unknown }).pgids
        : [];

    return Array.isArray(pgidsField) ? pgidsField.map((value) => Number(value)) : [];
  };

  const heartbeatExists = ({ instanceId }: { instanceId: SiegeInstance['id'] }): boolean =>
    existsSync(join(evidenceDir({ instanceId }), locationsStatics.siegelense.heartbeat));

  const waitForHeartbeatPgids = async ({
    instanceId,
    deadlineMs,
  }: {
    instanceId: SiegeInstance['id'];
    deadlineMs: number;
  }): Promise<readonly number[]> => {
    const found = heartbeatPgids({ instanceId });
    if (found.length > 0) {
      return found;
    }

    if (Date.now() >= deadlineMs) {
      return [];
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, HEARTBEAT_POLL_MS);
    });

    return waitForHeartbeatPgids({ instanceId, deadlineMs });
  };

  // Polls every named group's liveness rather than sleeping a fixed escalation window — a test
  // waiting on this returns the moment laneTeardownBroker's SIGTERM -> graceMs -> SIGKILL pass
  // actually finishes, instead of always paying the worst case.
  const waitForGroupsDead = async ({
    pgids,
    deadlineMs,
  }: {
    pgids: readonly number[];
    deadlineMs: number;
  }): Promise<boolean> => {
    if (pgids.every((pgid) => !processIsAliveBroker({ pgid }))) {
      return true;
    }

    if (Date.now() >= deadlineMs) {
      return false;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, HEARTBEAT_POLL_MS);
    });

    return waitForGroupsDead({ pgids, deadlineMs });
  };

  // The driver's own OS process is spawned via `spawnDetached` — the same
  // `detached: true` spawn every lane process uses — so its pgid numerically equals its own pid
  // (that adapter's own header), and `processIsAliveBroker`'s `kill(-pgid, 0)` probe reads it
  // exactly like any other lane process group.
  const waitForDriverProcessExit = async ({
    pid,
    deadlineMs,
  }: {
    pid: string;
    deadlineMs: number;
  }): Promise<boolean> => {
    if (!processIsAliveBroker({ pgid: Number(pid) })) {
      return true;
    }

    if (Date.now() >= deadlineMs) {
      return false;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, HEARTBEAT_POLL_MS);
    });

    return waitForDriverProcessExit({ pid, deadlineMs });
  };

  // Polls for the marker DriverServeLayerResponder writes on the IDLE path only, before it tears
  // the lane down — never on a `kill` (that file's own header). Its presence is the signal the
  // driver actually reached the self-reap branch, independent of whether the reap that followed
  // it succeeded in killing anything.
  const waitForShutdownReason = async ({
    instanceId,
    deadlineMs,
  }: {
    instanceId: SiegeInstance['id'];
    deadlineMs: number;
  }): Promise<boolean> => {
    const marker = await shutdownReasonReadBroker({ evidencePath: evidenceDir({ instanceId }) });
    if (marker !== null) {
      return true;
    }

    if (Date.now() >= deadlineMs) {
      return false;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, HEARTBEAT_POLL_MS);
    });

    return waitForShutdownReason({ instanceId, deadlineMs });
  };

  const evidenceDirExists = ({ instanceId }: { instanceId: SiegeInstance['id'] }): boolean =>
    existsSync(evidenceDir({ instanceId }));

  const apiLogExists = ({ instanceId }: { instanceId: SiegeInstance['id'] }): boolean =>
    existsSync(join(evidenceDir({ instanceId }), locationsStatics.siegelense.apiLog));

  const homeDirExists = ({ instanceId }: { instanceId: SiegeInstance['id'] }): boolean =>
    existsSync(locationsInstanceHomePathFindBroker({ instanceId }));

  const reapDirectly = async ({
    instanceId,
  }: {
    instanceId: SiegeInstance['id'];
  }): Promise<void> => {
    const entry = await registryEntry({ instanceId }).catch((error: unknown) => {
      stderr.write(
        `[driver-fleet.harness] registry read failed reaping ${instanceId}: ${String(error)}\n`,
      );
      return undefined;
    });

    entry?.pgids.forEach((pgid) => {
      if (processIsAliveBroker({ pgid })) {
        processKillGroupBroker({ pgid, signal: 'SIGKILL' });
      }
    });

    await instanceKillBroker({ instanceId }).catch((error: unknown) => {
      stderr.write(
        `[driver-fleet.harness] instanceKillBroker failed reaping ${instanceId}: ${String(error)}\n`,
      );
    });
  };

  const afterAll = async (): Promise<void> => {
    await Promise.all(
      Array.from(trackedInstanceIds).map(async (instanceId) => reapDirectly({ instanceId })),
    );
  };

  return {
    ensureHomeReady,
    configureApiLane,
    boot,
    killViaBroker,
    sigkillDriverPid,
    registryEntry,
    pingSocket,
    isGroupAlive,
    isPortFree,
    heartbeatPgids,
    heartbeatExists,
    waitForHeartbeatPgids,
    waitForDriverProcessExit,
    waitForGroupsDead,
    waitForShutdownReason,
    evidenceDirExists,
    apiLogExists,
    homeDirExists,
    afterAll,
  };
};
