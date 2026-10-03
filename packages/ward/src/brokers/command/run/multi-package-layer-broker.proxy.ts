import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { argvProxy } from '#gateway/node/process/argv/argv.proxy';
import { execPathProxy } from '#gateway/node/process/exec-path/exec-path.proxy';
import { execPath } from '#gateway/node/process';
import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { streamProxy } from '#gateway/node/child_process/stream/stream.proxy';
import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { setIntervalProxy } from '#gateway/node/setInterval/set-interval/set-interval.proxy';
import { clearIntervalProxy } from '#gateway/node/clearInterval/clear-interval/clear-interval.proxy';
import { NodeVersionUnsupportedErrorProxy } from '#gateway/node/sqlite/node-version-unsupported.error.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { capacityReadBrokerProxy } from '@dungeonmaster/load-balancer/brokers/capacity/read/capacity-read-broker.proxy';
import { leaseTakeBrokerProxy } from '@dungeonmaster/load-balancer/brokers/lease/take/lease-take-broker.proxy';
import { leaseBeatBrokerProxy } from '@dungeonmaster/load-balancer/brokers/lease/beat/lease-beat-broker.proxy';
import { leaseReleaseBrokerProxy } from '@dungeonmaster/load-balancer/brokers/lease/release/lease-release-broker.proxy';
import { memoryPeakSampleBrokerProxy } from '@dungeonmaster/load-balancer/brokers/memory/peak-sample/memory-peak-sample-broker.proxy';
import { MachineReadingStub } from '@dungeonmaster/load-balancer/contracts/machine-reading/machine-reading.stub';
import { LeaseStub } from '@dungeonmaster/load-balancer/contracts/lease/lease.stub';

import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { wardSpawnCommandStatics } from '../../../statics/ward-spawn-command/ward-spawn-command-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { DurationSample } from '../../../contracts/duration-sample/duration-sample-contract';
import { DurationSampleStub } from '../../../contracts/duration-sample/duration-sample.stub';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';
import { historyRootFindBrokerProxy } from '../../history/root-find/history-root-find-broker.proxy';
import { historyReadBrokerProxy } from '../../history/read/history-read-broker.proxy';
import { historyWriteBrokerProxy } from '../../history/write/history-write-broker.proxy';
import { childCrashLayerBrokerProxy } from './child-crash-layer-broker.proxy';

type DatabaseSync = ReturnType<typeof DatabaseSyncStub>;

const initDbSchema = (db: DatabaseSync): void => {
  db.exec(
    'CREATE TABLE IF NOT EXISTS durations (repo_root TEXT, package TEXT, check_type TEXT, duration_ms INTEGER, peak_rss_mb INTEGER NULL, shards INTEGER NULL, recorded_at_ms INTEGER);',
  );
  db.exec(
    'CREATE INDEX IF NOT EXISTS idx_durations_lookup ON durations (repo_root, package, check_type, recorded_at_ms);',
  );
  db.exec(
    'CREATE TABLE IF NOT EXISTS leases (lease_id TEXT PRIMARY KEY, tool TEXT, label TEXT, owner_pid INTEGER, state TEXT, expected_peak_mb INTEGER NULL, current_rss_mb INTEGER NULL, started_at_ms INTEGER, last_beat_ms INTEGER);',
  );
  db.exec('CREATE INDEX IF NOT EXISTS idx_leases_tool_state ON leases (tool, state);');
  db.exec(
    'CREATE TABLE IF NOT EXISTS leases_audit (action TEXT, lease_id TEXT, tool TEXT, label TEXT, owner_pid INTEGER, expected_peak_mb INTEGER NULL);',
  );
  db.exec(
    "CREATE TRIGGER IF NOT EXISTS audit_lease_insert AFTER INSERT ON leases BEGIN INSERT INTO leases_audit (action, lease_id, tool, label, owner_pid, expected_peak_mb) VALUES ('insert', NEW.lease_id, NEW.tool, NEW.label, NEW.owner_pid, NEW.expected_peak_mb); END;",
  );
  db.exec(
    "CREATE TRIGGER IF NOT EXISTS audit_lease_delete AFTER DELETE ON leases BEGIN INSERT INTO leases_audit (action, lease_id, tool, label, owner_pid, expected_peak_mb) VALUES ('delete', OLD.lease_id, OLD.tool, OLD.label, OLD.owner_pid, OLD.expected_peak_mb); END;",
  );
};

export const multiPackageLayerBrokerProxy = (): {
  setupSpawnAndLoad: (params: {
    rootPath: string;
    projectFolders: ProjectFolder[];
    subResultContent: string;
  }) => void;
  setupSpawnAndLoadSelective: (params: {
    rootPath: string;
    packages: { projectFolder: ProjectFolder; subResultContent: string }[];
  }) => void;
  setupSpawnWithNullLoad: (params: { rootPath: string; projectFolder: ProjectFolder }) => void;
  setupCrashedChildOverStaleResult: (params: {
    rootPath: string;
    projectFolder: ProjectFolder;
    childStdout: string;
    staleResultContent: string;
  }) => void;
  setupNoSpawns: (params: { rootPath: string }) => void;
  setupWardConcurrency: (params: { rootPath: string; concurrency: number }) => void;
  setupCapacitySuggestion: (params: { suggestion: number; diskPath?: string }) => void;
  setupCapacityReadThrows: (params: { error: Error }) => void;
  setupCapacityWarning: (params: { warning: string }) => void;
  setupMemoryPeak: (params: { peakMB: number | null; pid?: number }) => void;
  setupLeaseTakeThrows: (params?: { message?: string }) => void;
  setupLeaseReleaseThrows: (params?: { message?: string }) => void;
  getLeaseAuditEvents: () => {
    action: 'insert' | 'delete';
    leaseId: string;
    tool: string;
    label: string;
    ownerPid: number;
    expectedPeakMB: number | null;
  }[];
  getActiveLeases: () => {
    leaseId: string;
    tool: string;
    label: string;
    ownerPid: number;
    state: string;
    expectedPeakMB: number | null;
  }[];
  setupDurationHistory: (params: { samples: readonly DurationSample[] }) => void;
  setupDurationHistoryThrows: (params: { error: Error }) => void;
  setupDurationHistoryWriteThrows: (params: { error: Error }) => void;
  getWrittenDurationSamples: () => DurationSample[];
  getStderrCalls: () => unknown[];
  getAllSpawnedArgs: () => unknown[];
  getAllSpawnedCwds: () => string[];
  useBinFallback: () => void;
  wardEntry: string;
} => {
  // Date.now/Math.random take no identifying argument — the receiver is what a spy cannot see.
  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(runIdMockStatics.timestamp);
  registerSpyOn({ object: Math, method: 'random' })
    .calledWith([])
    .returns(runIdMockStatics.randomValue);
  const stderr = stderrProxy();
  nowProxy();

  const historyRootFindProxy = historyRootFindBrokerProxy();
  const historyReadProxy = historyReadBrokerProxy();
  const historyWriteProxy = historyWriteBrokerProxy();
  const sharedDb = DatabaseSyncStub();
  initDbSchema(sharedDb);
  historyReadProxy.setupDatabase({ database: sharedDb });
  historyWriteProxy.setupDatabase({ database: sharedDb });

  const capacityProxy = capacityReadBrokerProxy();
  const leaseTakeProxy = leaseTakeBrokerProxy();
  const leaseBeatProxy = leaseBeatBrokerProxy();
  const leaseReleaseProxy = leaseReleaseBrokerProxy();
  const memorySampleProxy = memoryPeakSampleBrokerProxy();
  setIntervalProxy();
  clearIntervalProxy();

  leaseTakeProxy.setupDatabase({ database: sharedDb });
  leaseBeatProxy.setupDatabase({ database: sharedDb });
  leaseReleaseProxy.setupDatabase({ database: sharedDb });
  NodeVersionUnsupportedErrorProxy();

  const stream = streamProxy();
  RunNotFoundErrorProxy();
  const binProxy = binResolveBrokerProxy();
  const argvStage = argvProxy();
  execPathProxy();
  // The compiled entry script a real parent ward was started from. Every setup stages argv with it,
  // so the broker spawns its children as `<execPath> <this script>`; `useBinFallback` switches a
  // test to a parent with no compiled entry, which resolves the bin by name instead.
  const wardEntry = '/home/user/project/packages/ward/dist/bin/ward-entry.js';
  const mode: { binFallback: boolean } = { binFallback: false };
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();
  const loadProxy = storageLoadBrokerProxy();
  childCrashLayerBrokerProxy();
  // The resolved bin path depends on rootPath, so `getAllSpawnedArgs` (which takes no params)
  // addresses the spawn read against whatever setup last resolved — set here, read there.
  const resolvedCommandRef: { value: string } = { value: '/project/node_modules/.bin/eslint' };
  const resolvedRootPathRef: { value: string } = { value: '/project' };

  // Every child ward process embeds its own runId in the printed summary line, and this level's
  // own storageSaveBroker/storagePruneBroker calls generate a runId the same way — both read the
  // Date.now/Math.random spies staged above, so calling the real transformer here produces the
  // identical deterministic id both levels will actually use.
  const runId = runIdGenerateTransformer();
  // Matches what a child ward actually prints — id plus the trailing total-duration suffix.
  const childSummaryLine = `run: ${runId}  (1.2s)\n`;

  const resolveWardBin = ({ rootPath }: { rootPath: string }): string => {
    resolvedRootPathRef.value = rootPath;
    historyRootFindProxy.setupCommonDirFound({ commonDir: `${rootPath}/.git` });
    capacityProxy.setupDefaults({
      diskPath: rootPath,
      machine: MachineReadingStub({
        cores: 8,
        loadAvg: [1.0, 1.0, 1.0],
      }),
    });
    memorySampleProxy.setupSamples({ rootPid: 1234, samples: [null] });
    if (!mode.binFallback) {
      argvStage.setupArgv({ argv: [execPath, wardEntry] });
      resolvedCommandRef.value = execPath;
      return execPath;
    }
    argvStage.setupArgv({ argv: [execPath] });
    const command = binProxy.setupFound({
      cwd: rootPath,
      binName: wardSpawnCommandStatics.bin,
    });
    resolvedCommandRef.value = command;
    return command;
  };

  return {
    setupSpawnAndLoad: ({
      rootPath,
      projectFolders,
      subResultContent,
    }: {
      rootPath: string;
      projectFolders: ProjectFolder[];
      subResultContent: string;
    }): void => {
      // Addressed by COMMAND ONLY (no args/cwd): one child is spawned per folder, each with its
      // own args, and every one of them gets the SAME success output regardless — the folder is
      // what tells the loaded sub-results apart, via `loadProxy.setupRunById` below, not the spawn.
      const command = resolveWardBin({ rootPath });
      stream.setupSuccess({ command, exitCode: 0, stdout: childSummaryLine, stderr: '' });
      for (const folder of projectFolders) {
        loadProxy.setupRunById({
          rootPath: folder.path,
          runId,
          content: subResultContent,
        });
      }
      saveProxy.setupSuccess({ rootPath, runId });
      pruneProxy.setupEmpty({ rootPath });
    },

    setupSpawnAndLoadSelective: ({
      rootPath,
      packages,
    }: {
      rootPath: string;
      packages: { projectFolder: ProjectFolder; subResultContent: string }[];
    }): void => {
      const command = resolveWardBin({ rootPath });
      stream.setupSuccess({ command, exitCode: 0, stdout: childSummaryLine, stderr: '' });
      for (const pkg of packages) {
        loadProxy.setupRunById({
          rootPath: pkg.projectFolder.path,
          runId,
          content: pkg.subResultContent,
        });
      }
      saveProxy.setupSuccess({ rootPath, runId });
      pruneProxy.setupEmpty({ rootPath });
    },

    setupSpawnWithNullLoad: ({
      rootPath,
      projectFolder,
    }: {
      rootPath: string;
      projectFolder: ProjectFolder;
    }): void => {
      const command = resolveWardBin({ rootPath });
      stream.setupSuccess({ command, exitCode: 1, stdout: childSummaryLine, stderr: '' });
      loadProxy.setupReadFail({
        rootPath: projectFolder.path,
        runId,
      });
      saveProxy.setupSuccess({ rootPath, runId });
      pruneProxy.setupEmpty({ rootPath });
    },

    // A child that died before printing its summary line, in a package whose `.ward/` still holds
    // the result of an EARLIER run. Both are staged: the crashed spawn, and a loadable latest-run
    // file that a bare "load newest" would happily return as this run's outcome.
    setupCrashedChildOverStaleResult: ({
      rootPath,
      projectFolder,
      childStdout,
      staleResultContent,
    }: {
      rootPath: string;
      projectFolder: ProjectFolder;
      childStdout: string;
      staleResultContent: string;
    }): void => {
      const command = resolveWardBin({ rootPath });
      stream.setupSuccess({ command, exitCode: 1, stdout: childStdout, stderr: '' });
      const staleRunId = RunIdStub({ value: '1739000000000-01de' });
      loadProxy.setupLatestRun({
        rootPath: projectFolder.path,
        entries: [`run-${staleRunId}.json`],
        latestEntry: `run-${staleRunId}.json`,
        content: staleResultContent,
      });
      saveProxy.setupSuccess({ rootPath, runId });
      pruneProxy.setupEmpty({ rootPath });
    },

    setupNoSpawns: ({ rootPath }: { rootPath: string }): void => {
      resolveWardBin({ rootPath });
      saveProxy.setupSuccess({ rootPath, runId });
      pruneProxy.setupEmpty({ rootPath });
    },

    // Sets up capacity suggestion to govern concurrency
    setupWardConcurrency: ({
      rootPath,
      concurrency,
    }: {
      rootPath: string;
      concurrency: number;
    }): void => {
      capacityProxy.setupMachine({
        diskPath: rootPath,
        machine: MachineReadingStub({
          cores: concurrency + 1,
          loadAvg: [1.0, 1.0, 1.0],
          freeMemMB: 100000,
          totalMemMB: 100000,
        }),
      });
    },

    setupCapacitySuggestion: ({
      suggestion,
      diskPath,
    }: {
      suggestion: number;
      diskPath?: string;
    }): void => {
      if (suggestion === 0) {
        capacityProxy.setupLeases({
          leases: [LeaseStub({ startedAtMs: Date.now() })],
        });
        capacityProxy.setupMachine({
          diskPath: diskPath ?? resolvedRootPathRef.value,
          machine: MachineReadingStub({
            cores: 2,
            loadAvg: [1.0, 1.0, 1.0],
            freeMemMB: 100000,
            totalMemMB: 100000,
          }),
        });
        return;
      }
      capacityProxy.setupLeases({ leases: [] });
      capacityProxy.setupMachine({
        diskPath: diskPath ?? resolvedRootPathRef.value,
        machine: MachineReadingStub({
          cores: suggestion + 1,
          loadAvg: [1.0, 1.0, 1.0],
          freeMemMB: 100000,
          totalMemMB: 100000,
        }),
      });
    },

    setupCapacityReadThrows: ({ error }: { error: Error }): void => {
      capacityProxy.setupThrows({ error });
    },

    setupCapacityWarning: ({ warning }: { warning: string }): void => {
      capacityProxy.setupLimits({ warning });
    },

    setupMemoryPeak: ({ peakMB, pid = 1234 }: { peakMB: number | null; pid?: number }): void => {
      memorySampleProxy.setupSamples({ rootPid: pid, samples: [peakMB] });
    },

    setupLeaseTakeThrows: (params?: { message?: string }): void => {
      const msg = params?.message ?? 'lease take failed';
      sharedDb.exec(
        `CREATE TRIGGER IF NOT EXISTS fail_lease_insert BEFORE INSERT ON leases BEGIN SELECT RAISE(FAIL, '${msg}'); END;`,
      );
    },

    setupLeaseReleaseThrows: (params?: { message?: string }): void => {
      const msg = params?.message ?? 'lease release failed';
      sharedDb.exec(
        `CREATE TRIGGER IF NOT EXISTS fail_lease_delete BEFORE DELETE ON leases BEGIN SELECT RAISE(FAIL, '${msg}'); END;`,
      );
    },

    getLeaseAuditEvents: (): {
      action: 'insert' | 'delete';
      leaseId: string;
      tool: string;
      label: string;
      ownerPid: number;
      expectedPeakMB: number | null;
    }[] => {
      const statement = sharedDb.prepare(
        'SELECT action, lease_id, tool, label, owner_pid, expected_peak_mb FROM leases_audit;',
      );
      const rows = statement.all() as {
        action: 'insert' | 'delete';
        lease_id: string;
        tool: string;
        label: string;
        owner_pid: number;
        expected_peak_mb: number | null;
      }[];
      return rows.map((row) => ({
        action: row.action,
        leaseId: row.lease_id,
        tool: row.tool,
        label: row.label,
        ownerPid: row.owner_pid,
        expectedPeakMB: row.expected_peak_mb,
      }));
    },

    getActiveLeases: (): {
      leaseId: string;
      tool: string;
      label: string;
      ownerPid: number;
      state: string;
      expectedPeakMB: number | null;
    }[] => {
      const statement = sharedDb.prepare(
        'SELECT lease_id, tool, label, owner_pid, state, expected_peak_mb FROM leases ORDER BY started_at_ms ASC;',
      );
      const rows = statement.all() as {
        lease_id: string;
        tool: string;
        label: string;
        owner_pid: number;
        state: string;
        expected_peak_mb: number | null;
      }[];
      return rows.map((row) => ({
        leaseId: row.lease_id,
        tool: row.tool,
        label: row.label,
        ownerPid: row.owner_pid,
        state: row.state,
        expectedPeakMB: row.expected_peak_mb,
      }));
    },

    useBinFallback: (): void => {
      mode.binFallback = true;
    },

    wardEntry,

    getAllSpawnedCwds: (): string[] => [
      ...stream.getSpawnedCwds({ command: resolvedCommandRef.value }),
    ],

    setupDurationHistory: ({ samples }: { samples: readonly DurationSample[] }): void => {
      const insert = sharedDb.prepare(
        'INSERT INTO durations (repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?);',
      );
      for (const sample of samples) {
        insert.run(
          sample.repoRoot,
          sample.packageName,
          sample.checkType,
          sample.durationMs,
          sample.peakRssMB,
          sample.shards,
          sample.recordedAtMs,
        );
      }
    },

    setupDurationHistoryThrows: ({ error }: { error: Error }): void => {
      historyReadProxy.setupThrows({ error });
    },

    setupDurationHistoryWriteThrows: ({ error }: { error: Error }): void => {
      const spy = registerSpyOn({ object: sharedDb, method: 'exec', passthrough: true });
      spy.calledWith(['BEGIN IMMEDIATE;']).throws(error);
      spy.calledWith(['ROLLBACK;']).returns(undefined);
    },

    getWrittenDurationSamples: (): DurationSample[] => {
      const statement = sharedDb.prepare(
        'SELECT repo_root, package, check_type, duration_ms, peak_rss_mb, shards, recorded_at_ms FROM durations ORDER BY recorded_at_ms ASC;',
      );
      const rows = statement.all() as {
        repo_root: string;
        package: string;
        check_type: string;
        duration_ms: number;
        peak_rss_mb: number | null;
        shards: number | null;
        recorded_at_ms: number;
      }[];
      return rows.map((row) =>
        DurationSampleStub({
          repoRoot: row.repo_root,
          packageName: row.package,
          checkType: row.check_type as DurationSample['checkType'],
          durationMs: row.duration_ms,
          peakRssMB: row.peak_rss_mb,
          shards: row.shards,
          recordedAtMs: row.recorded_at_ms,
        }),
      );
    },

    getStderrCalls: (): unknown[] => [...stderr.getWrites()],
    getAllSpawnedArgs: (): unknown[] => [
      ...stream.getCallsFor({ command: resolvedCommandRef.value }),
    ],
  };
};
