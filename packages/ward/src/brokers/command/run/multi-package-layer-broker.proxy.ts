import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { streamProxy } from '#gateway/node/child_process/stream/stream.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { DungeonmasterConfigStub } from '@dungeonmaster/config/contracts/dungeonmaster-config/dungeonmaster-config.stub';
import { configResolveBrokerProxy } from '@dungeonmaster/config/startup/start-config.proxy';

import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
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
    rootPath: string;
    projectFolders: ProjectFolder[];
    subResultContent: string;
  }) => void;
  setupSpawnAndLoadSelective: (params: {
    rootPath: string;
    packages: { projectFolder: ProjectFolder; subResultContent: string }[];
  }) => void;
  setupSpawnWithNullLoad: (params: {
    rootPath: string;
    projectFolder: ProjectFolder;
  }) => void;
  setupCrashedChildOverStaleResult: (params: {
    rootPath: string;
    projectFolder: ProjectFolder;
    childStdout: string;
    staleResultContent: string;
  }) => void;
  setupNoSpawns: (params: { rootPath: string }) => void;
  setupWardConcurrency: (params: { rootPath: string; concurrency: number }) => void;
  getStderrCalls: () => unknown[];
  getAllSpawnedArgs: () => unknown[];
} => {
  // Date.now/Math.random take no identifying argument — the receiver is what a spy cannot see.
  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(runIdMockStatics.timestamp);
  registerSpyOn({ object: Math, method: 'random' })
    .calledWith([])
    .returns(runIdMockStatics.randomValue);
  const stderr = stderrProxy();

  const stream = streamProxy();
  RunNotFoundErrorProxy();
  const binProxy = binResolveBrokerProxy();
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
      filePath: `${String(rootPath)}/package.json`,
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
    const command = binProxy.setupFound({
      cwd: rootPath,
      binName: wardSpawnCommandStatics.bin,
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
      rootPath: string;
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
      const command = String(resolveWardBin({ rootPath }));
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
      const command = String(resolveWardBin({ rootPath }));
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
      const command = String(resolveWardBin({ rootPath }));
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

    getStderrCalls: (): unknown[] => [...stderr.getWrites()],
    getAllSpawnedArgs: (): unknown[] => [
      ...stream.getCallsFor({ command: String(resolvedCommandRef.value) }),
    ],
  };
};
