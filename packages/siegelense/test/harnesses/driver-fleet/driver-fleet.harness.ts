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
 * const manifest = await fleet.boot({ specName: SpecNameStub({ value: 'dungeonmaster-headless' }) });
 * const entry = await fleet.registryEntry({ instanceId: manifest.instanceId });
 * const result = await fleet.killViaBroker({ instanceId: manifest.instanceId });
 * // fleet.afterAll() reaps anything still alive when the suite ends
 */

import { existsSync, mkdirSync, readFileSync } from 'fs';
import { createServer } from 'net';
import { kill } from 'process';
import { resolve as resolvePath } from 'path';

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath, NetworkPort, ProcessId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { instanceKillBroker } from '../../../src/brokers/instance/kill/instance-kill-broker';
import { instanceStartBroker } from '../../../src/brokers/instance/start/instance-start-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../../src/brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsInstanceHomePathFindBroker } from '../../../src/brokers/locations/instance-home-path-find/locations-instance-home-path-find-broker';
import { registryReadBroker } from '../../../src/brokers/registry/read/registry-read-broker';
import { netUnixRequestAdapter } from '../../../src/adapters/net/unix-request/net-unix-request-adapter';
import { processIsAliveAdapter } from '../../../src/adapters/process/is-alive/process-is-alive-adapter';
import { processKillGroupAdapter } from '../../../src/adapters/process/kill-group/process-kill-group-adapter';
import { DriverRequestStub } from '../../../src/contracts/driver-request/driver-request.stub';
import type { InstanceId } from '../../../src/contracts/instance-id/instance-id-contract';
import type { InstanceManifest } from '../../../src/contracts/instance-manifest/instance-manifest-contract';
import type { KillResult } from '../../../src/contracts/kill-result/kill-result-contract';
import { ProcessGroupIdStub } from '../../../src/contracts/process-group-id/process-group-id.stub';
import type { ProcessGroupId } from '../../../src/contracts/process-group-id/process-group-id-contract';
import type { RegistryEntry } from '../../../src/contracts/registry-entry/registry-entry-contract';
import type { SpecName } from '../../../src/contracts/spec-name/spec-name-contract';
import { driverStatics } from '../../../src/statics/driver/driver-statics';

// How often waitForHeartbeatPgids re-checks the file. instanceLifecycleStatics.heartbeat.intervalMs
// (5000ms) is the ticker's own cadence, so polling at a fraction of it catches the first beat
// promptly without hammering the filesystem.
const HEARTBEAT_POLL_MS = 500;

// Both built-in lane specs declare `requiresFakeAgentCli: true` (lane-spec-statics.ts), and
// laneBootBroker refuses to boot one unless CLAUDE_CLI_PATH/WARD_CLI_PATH are already in the
// environment it inherits (fake-agent-cli-statics.ts) — a real Claude/ward run spends real API
// usage and produces a non-deterministic reading, which is exactly what this teardown suite's
// measurements cannot tolerate. Neither fixture ships in this package's published `dist/`, so
// there is no locationsStatics home for either path — same reasoning as siege-lane.ts, which
// resolves the identical two binaries the identical way. instanceStartBroker spawns the driver
// with no `env` override, so the driver inherits process.env from THIS jest worker: setting these
// here, before any fleet.boot() call, is what the spawned driver — and the api process ITS OWN
// laneBootBroker call spawns in turn — sees.
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

export const driverFleetHarness = (): {
  ensureHomeReady: (params: { home: string }) => void;
  boot: (params: { specName: SpecName }) => Promise<InstanceManifest>;
  killViaBroker: (params: { instanceId: InstanceId }) => Promise<KillResult>;
  sigkillDriverPid: (params: { pid: ProcessId }) => void;
  registryEntry: (params: { instanceId: InstanceId }) => Promise<RegistryEntry | undefined>;
  pingSocket: (params: { instanceId: InstanceId }) => Promise<boolean>;
  isGroupAlive: (params: { pgid: ProcessGroupId }) => boolean;
  isPortFree: (params: { port: NetworkPort }) => Promise<boolean>;
  heartbeatPgids: (params: { instanceId: InstanceId }) => readonly ProcessGroupId[];
  heartbeatExists: (params: { instanceId: InstanceId }) => boolean;
  waitForHeartbeatPgids: (params: {
    instanceId: InstanceId;
    deadlineMs: number;
  }) => Promise<readonly ProcessGroupId[]>;
  waitForDriverProcessExit: (params: { pid: ProcessId; deadlineMs: number }) => Promise<boolean>;
  evidenceDirExists: (params: { instanceId: InstanceId }) => boolean;
  apiLogExists: (params: { instanceId: InstanceId }) => boolean;
  homeDirExists: (params: { instanceId: InstanceId }) => boolean;
  afterAll: () => Promise<void>;
} => {
  const trackedInstanceIds = new Set<InstanceId>();

  // Stopgap for a confirmed, separately-owned gap: a fresh DUNGEONMASTER_HOME has no `siegelense/`
  // directory yet — `dungeonmaster init`'s InstallLinkCreateResponder is what normally creates it,
  // and this harness's isolated testbed home never runs init. Without this, the very first registry
  // lock acquire fails with a raw ENOENT before any instance-lifecycle code runs at all.
  const ensureHomeReady = ({ home }: { home: string }): void => {
    mkdirSync(`${home}/siegelense`, { recursive: true });
  };

  const evidenceDir = ({ instanceId }: { instanceId: InstanceId }): AbsoluteFilePath =>
    locationsInstanceEvidencePathFindBroker({ instanceId, guildId: null });

  const boot = async ({ specName }: { specName: SpecName }): Promise<InstanceManifest> => {
    // See the module-level comment on FAKE_CLAUDE_CLI_PATH/FAKE_WARD_CLI_PATH above. Set here
    // rather than in the constructor (enforce-harness-patterns bans a constructor side effect) —
    // instanceStartBroker spawns the driver with no `env` override, so the driver inherits
    // process.env from THIS jest worker at spawn time, and this assignment must land before that.
    process.env.CLAUDE_CLI_PATH = FAKE_CLAUDE_CLI_PATH;
    process.env.WARD_CLI_PATH = FAKE_WARD_CLI_PATH;

    const manifest = await instanceStartBroker({
      specName,
      questId: null,
      guildId: null,
      seed: null,
    });
    trackedInstanceIds.add(manifest.instanceId);
    return manifest;
  };

  const killViaBroker = async ({ instanceId }: { instanceId: InstanceId }): Promise<KillResult> =>
    instanceKillBroker({ instanceId });

  const sigkillDriverPid = ({ pid }: { pid: ProcessId }): void => {
    kill(Number(pid), 'SIGKILL');
  };

  const registryEntry = async ({
    instanceId,
  }: {
    instanceId: InstanceId;
  }): Promise<RegistryEntry | undefined> => {
    const registry = await registryReadBroker();
    return registry.instances.find((candidate) => candidate.id === instanceId);
  };

  const pingSocket = async ({ instanceId }: { instanceId: InstanceId }): Promise<boolean> => {
    const entry = await registryEntry({ instanceId });
    const socketPath = entry?.socketPath ?? null;
    if (socketPath === null) {
      return false;
    }

    return netUnixRequestAdapter({
      socketPath,
      request: DriverRequestStub({ kind: 'ping' }),
      timeoutMs: driverStatics.socket.requestTimeoutMs,
    })
      .then((response) => response.ok)
      .catch(() => false);
  };

  const isGroupAlive = ({ pgid }: { pgid: ProcessGroupId }): boolean =>
    processIsAliveAdapter({ pgid });

  const isPortFree = async ({ port }: { port: NetworkPort }): Promise<boolean> =>
    new Promise((resolve) => {
      const probe = createServer();
      probe.once('error', () => {
        resolve(false);
      });
      probe.listen(port, () => {
        probe.close(() => {
          resolve(true);
        });
      });
    });

  const heartbeatPgids = ({
    instanceId,
  }: {
    instanceId: InstanceId;
  }): readonly ProcessGroupId[] => {
    const heartbeatPath = pathJoinAdapter({
      paths: [evidenceDir({ instanceId }), locationsStatics.siegelense.heartbeat],
    });

    if (!existsSync(heartbeatPath)) {
      return [];
    }

    const parsed: unknown = JSON.parse(readFileSync(heartbeatPath, 'utf8'));
    const pgidsField =
      typeof parsed === 'object' && parsed !== null && 'pgids' in parsed
        ? (parsed as { pgids: unknown }).pgids
        : [];

    return Array.isArray(pgidsField)
      ? pgidsField.map((value) => ProcessGroupIdStub({ value: Number(value) }))
      : [];
  };

  const heartbeatExists = ({ instanceId }: { instanceId: InstanceId }): boolean =>
    existsSync(
      pathJoinAdapter({
        paths: [evidenceDir({ instanceId }), locationsStatics.siegelense.heartbeat],
      }),
    );

  const waitForHeartbeatPgids = async ({
    instanceId,
    deadlineMs,
  }: {
    instanceId: InstanceId;
    deadlineMs: number;
  }): Promise<readonly ProcessGroupId[]> => {
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

  // The driver's own OS process is spawned via childProcessSpawnDetachedAdapter — the same
  // `detached: true` spawn every lane process uses — so its pgid numerically equals its own pid
  // (that adapter's own header), and `processIsAliveAdapter`'s `kill(-pgid, 0)` probe reads it
  // exactly like any other lane process group.
  const waitForDriverProcessExit = async ({
    pid,
    deadlineMs,
  }: {
    pid: ProcessId;
    deadlineMs: number;
  }): Promise<boolean> => {
    if (!processIsAliveAdapter({ pgid: ProcessGroupIdStub({ value: Number(pid) }) })) {
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

  const evidenceDirExists = ({ instanceId }: { instanceId: InstanceId }): boolean =>
    existsSync(evidenceDir({ instanceId }));

  const apiLogExists = ({ instanceId }: { instanceId: InstanceId }): boolean =>
    existsSync(
      pathJoinAdapter({
        paths: [evidenceDir({ instanceId }), locationsStatics.siegelense.apiLog],
      }),
    );

  const homeDirExists = ({ instanceId }: { instanceId: InstanceId }): boolean =>
    existsSync(locationsInstanceHomePathFindBroker({ instanceId }));

  const reapDirectly = async ({ instanceId }: { instanceId: InstanceId }): Promise<void> => {
    const entry = await registryEntry({ instanceId }).catch((error: unknown) => {
      process.stderr.write(
        `[driver-fleet.harness] registry read failed reaping ${instanceId}: ${String(error)}\n`,
      );
      return undefined;
    });

    entry?.pgids.forEach((pgid) => {
      if (processIsAliveAdapter({ pgid })) {
        processKillGroupAdapter({ pgid, signal: 'SIGKILL' });
      }
    });

    await instanceKillBroker({ instanceId }).catch((error: unknown) => {
      process.stderr.write(
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
    evidenceDirExists,
    apiLogExists,
    homeDirExists,
    afterAll,
  };
};
