import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { argvProxy } from '#gateway/node/process/argv/argv.proxy';
import { execPathProxy } from '#gateway/node/process/exec-path/exec-path.proxy';
import { execPath } from '#gateway/node/process';
import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { streamProxy } from '#gateway/node/child_process/stream/stream.proxy';
import { DatabaseSyncStub } from '#gateway/node/sqlite/database-sync.stub';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { DungeonmasterConfigStub } from '@dungeonmaster/config/contracts/dungeonmaster-config/dungeonmaster-config.stub';
import { configResolveBrokerProxy } from '@dungeonmaster/config/startup/start-config.proxy';

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
  historyReadProxy.setupDatabase({ database: sharedDb });
  historyWriteProxy.setupDatabase({ database: sharedDb });

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

  const configProxy = configResolveBrokerProxy();
  // A resolved config carrying no `ward` key at all, matching what a consumer who has never heard
  // of this key gets back for real (see P14) — the broker under test falls back to
  // configDefaultsStatics.ward.concurrency.default on its own. Staged per rootPath by every
  // setup method below, addressed by the exact `{filePath}` the broker builds.
  const stageConfigForRoot = ({
    rootPath,
    config,
  }: {
    rootPath: string;
    config: ReturnType<typeof DungeonmasterConfigStub>;
  }): void => {
    configProxy.setupResolves({
      filePath: `${rootPath}/package.json`,
      config,
    });
  };

  // Every child ward process embeds its own runId in the printed summary line, and this level's
  // own storageSaveBroker/storagePruneBroker calls generate a runId the same way — both read the
  // Date.now/Math.random spies staged above, so calling the real transformer here produces the
  // identical deterministic id both levels will actually use.
  const runId = runIdGenerateTransformer();
  // Matches what a child ward actually prints — id plus the trailing total-duration suffix.
  const childSummaryLine = `run: ${runId}  (1.2s)\n`;

  const resolveWardBin = ({ rootPath }: { rootPath: string }): string => {
    stageConfigForRoot({ rootPath, config: DungeonmasterConfigStub() });
    historyRootFindProxy.setupCommonDirFound({ commonDir: `${rootPath}/.git` });
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

    // Call AFTER the setupSpawn*/setupNoSpawns method: each of those stages the default config
    // for the same rootPath address, and the later staging wins.
    setupWardConcurrency: ({
      rootPath,
      concurrency,
    }: {
      rootPath: string;
      concurrency: number;
    }): void => {
      stageConfigForRoot({ rootPath, config: DungeonmasterConfigStub({ ward: { concurrency } }) });
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
