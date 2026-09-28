import { streamProxy } from '#gateway/node/child_process/stream/stream.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import {
  absoluteFilePathContract,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { configResolveBroker, DungeonmasterConfigStub } from '@dungeonmaster/config';

import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { wardSpawnCommandStatics } from '../../../statics/ward-spawn-command/ward-spawn-command-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';
import { childCrashLayerBrokerProxy } from './child-crash-layer-broker.proxy';

export const multiPackageLayerBrokerProxy = (): {
  setupSpawnAndLoad: (params: {
    rootPath: AbsoluteFilePath;
    projectFolders: ProjectFolder[];
    subResultContent: string;
  }) => void;
  setupSpawnAndLoadSelective: (params: {
    rootPath: AbsoluteFilePath;
    packages: { projectFolder: ProjectFolder; subResultContent: string }[];
  }) => void;
  setupSpawnWithNullLoad: (params: {
    rootPath: AbsoluteFilePath;
    projectFolder: ProjectFolder;
  }) => void;
  setupCrashedChildOverStaleResult: (params: {
    rootPath: AbsoluteFilePath;
    projectFolder: ProjectFolder;
    childStdout: string;
    staleResultContent: string;
  }) => void;
  setupNoSpawns: (params: { rootPath: AbsoluteFilePath }) => void;
  setupWardConcurrency: (params: { rootPath: AbsoluteFilePath; concurrency: number }) => void;
  getStderrCalls: () => unknown[];
  getAllSpawnedArgs: () => unknown[];
  getConfigResolveCallCount: () => unknown;
  getConfigResolveFilePaths: () => unknown[];
} => {
  // Date.now/Math.random take no identifying argument — the receiver is what a spy cannot see.
  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(runIdMockStatics.timestamp);
  registerSpyOn({ object: Math, method: 'random' })
    .calledWith([])
    .returns(runIdMockStatics.randomValue);
  // write()'s return value never varies by content — what was written is read back via
  // callsMatching below, so the catch-all stays unaddressed.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).returns(true);

  const stream = streamProxy();
  RunNotFoundErrorProxy();
  const binProxy = binResolveBrokerProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();
  const loadProxy = storageLoadBrokerProxy();
  childCrashLayerBrokerProxy();
  // The resolved bin path depends on rootPath, so `getAllSpawnedArgs` (which takes no params)
  // addresses the spawn read against whatever setup last resolved — set here, read there.
  const resolvedCommandRef: { value: BinCommand } = { value: BinCommandStub() };

  const configResolveHandle = registerMock({ fn: configResolveBroker });
  // A resolved config carrying no `ward` key at all, matching what a consumer who has never heard
  // of this key gets back for real (see P14) — the broker under test falls back to
  // configDefaultsStatics.ward.concurrency.default on its own. Staged per rootPath by every
  // setup method below, addressed by the exact `{filePath}` the broker builds.
  const stageConfigForRoot = ({
    rootPath,
    config,
  }: {
    rootPath: AbsoluteFilePath;
    config: ReturnType<typeof DungeonmasterConfigStub>;
  }): void => {
    configResolveHandle
      .calledWith([{ filePath: filePathContract.parse(`${String(rootPath)}/package.json`) }])
      .resolves(config);
  };

  // Every child ward process embeds its own runId in the printed summary line, and this level's
  // own storageSaveBroker/storagePruneBroker calls generate a runId the same way — both read the
  // Date.now/Math.random spies staged above, so calling the real transformer here produces the
  // identical deterministic id both levels will actually use.
  const runId = runIdGenerateTransformer();
  // Matches what a child ward actually prints — id plus the trailing total-duration suffix.
  const childSummaryLine = `run: ${runId}  (1.2s)\n`;

  const resolveWardBin = ({ rootPath }: { rootPath: AbsoluteFilePath }): BinCommand => {
    const command = binProxy.setupFound({
      cwd: rootPath,
      binName: BinCommandStub({ value: wardSpawnCommandStatics.bin }),
    });
    resolvedCommandRef.value = command;
    stageConfigForRoot({ rootPath, config: DungeonmasterConfigStub() });
    return command;
  };

  return {
    setupSpawnAndLoad: ({
      rootPath,
      projectFolders,
      subResultContent,
    }: {
      rootPath: AbsoluteFilePath;
      projectFolders: ProjectFolder[];
      subResultContent: string;
    }): void => {
      // Addressed by COMMAND ONLY (no args/cwd): one child is spawned per folder, each with its
      // own args, and every one of them gets the SAME success output regardless — the folder is
      // what tells the loaded sub-results apart, via `loadProxy.setupRunById` below, not the spawn.
      const command = String(resolveWardBin({ rootPath }));
      stream.setupSuccess({ command, exitCode: 0, stdout: childSummaryLine, stderr: '' });
      for (const folder of projectFolders) {
        loadProxy.setupRunById({
          rootPath: absoluteFilePathContract.parse(folder.path),
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
      rootPath: AbsoluteFilePath;
      packages: { projectFolder: ProjectFolder; subResultContent: string }[];
    }): void => {
      const command = String(resolveWardBin({ rootPath }));
      stream.setupSuccess({ command, exitCode: 0, stdout: childSummaryLine, stderr: '' });
      for (const pkg of packages) {
        loadProxy.setupRunById({
          rootPath: absoluteFilePathContract.parse(pkg.projectFolder.path),
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
      rootPath: AbsoluteFilePath;
      projectFolder: ProjectFolder;
    }): void => {
      const command = String(resolveWardBin({ rootPath }));
      stream.setupSuccess({ command, exitCode: 1, stdout: childSummaryLine, stderr: '' });
      loadProxy.setupReadFail({
        rootPath: absoluteFilePathContract.parse(projectFolder.path),
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
      rootPath: AbsoluteFilePath;
      projectFolder: ProjectFolder;
      childStdout: string;
      staleResultContent: string;
    }): void => {
      const command = String(resolveWardBin({ rootPath }));
      stream.setupSuccess({ command, exitCode: 1, stdout: childStdout, stderr: '' });
      const staleRunId = RunIdStub({ value: '1739000000000-01de' });
      loadProxy.setupLatestRun({
        rootPath: absoluteFilePathContract.parse(projectFolder.path),
        entries: [`run-${staleRunId}.json`],
        latestEntry: `run-${staleRunId}.json`,
        content: staleResultContent,
      });
      saveProxy.setupSuccess({ rootPath, runId });
      pruneProxy.setupEmpty({ rootPath });
    },

    setupNoSpawns: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
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
      rootPath: AbsoluteFilePath;
      concurrency: number;
    }): void => {
      stageConfigForRoot({ rootPath, config: DungeonmasterConfigStub({ ward: { concurrency } }) });
    },

    getStderrCalls: (): unknown[] => stderrSpy.callsMatching([]).map((call) => call[0]),
    getAllSpawnedArgs: (): unknown[] => [
      ...stream.getCallsFor({ command: String(resolvedCommandRef.value) }),
    ],
    getConfigResolveCallCount: (): unknown => configResolveHandle.callsMatching([]).length,
    // Deliberately un-narrowed: the whole `{filePath}` call argument, one entry per call. Inline
    // structural casts are forbidden in brokers/, so the test asserts on this shape with
    // toStrictEqual rather than the proxy destructuring it first.
    getConfigResolveFilePaths: (): unknown[] =>
      configResolveHandle.callsMatching([]).map((call) => call[0]),
  };
};
