import { childProcessSpawnStreamAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  ExitCodeStub,
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

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
import { commandRunLayerChildCrashBrokerProxy } from './command-run-layer-child-crash-broker.proxy';

export const commandRunLayerMultiBrokerProxy = (): {
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
  getStderrCalls: () => unknown[];
  getAllSpawnedArgs: () => unknown[];
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

  const streamProxy = childProcessSpawnStreamAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();
  const loadProxy = storageLoadBrokerProxy();
  commandRunLayerChildCrashBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });

  // Every child ward process embeds its own runId in the printed summary line, and this level's
  // own storageSaveBroker/storagePruneBroker calls generate a runId the same way — both read the
  // Date.now/Math.random spies staged above, so calling the real transformer here produces the
  // identical deterministic id both levels will actually use.
  const runId = runIdGenerateTransformer();
  // Matches what a child ward actually prints — id plus the trailing total-duration suffix.
  const childSummaryLine = `run: ${runId}  (1.2s)\n`;

  const resolveWardBin = ({ rootPath }: { rootPath: AbsoluteFilePath }): BinCommand =>
    binProxy.setupFound({
      cwd: rootPath,
      binName: BinCommandStub({ value: wardSpawnCommandStatics.bin }),
    });

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
      const command = String(resolveWardBin({ rootPath }));
      for (const folder of projectFolders) {
        streamProxy.setupSuccess({
          command,
          exitCode: successCode,
          stdout: childSummaryLine,
          stderr: '',
        });
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
      for (const pkg of packages) {
        streamProxy.setupSuccess({
          command,
          exitCode: successCode,
          stdout: childSummaryLine,
          stderr: '',
        });
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
      streamProxy.setupSuccess({
        command,
        exitCode: ExitCodeStub({ value: 1 }),
        stdout: childSummaryLine,
        stderr: '',
      });
      loadProxy.setupReadFail({
        rootPath: absoluteFilePathContract.parse(projectFolder.path),
        runId,
        error: new Error('ENOENT'),
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
      streamProxy.setupSuccess({
        command,
        exitCode: ExitCodeStub({ value: 1 }),
        stdout: childStdout,
        stderr: '',
      });
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

    getStderrCalls: (): unknown[] => stderrSpy.callsMatching([]).map((call) => call[0]),
    getAllSpawnedArgs: (): unknown[] => streamProxy.getAllSpawnedArgs(),
  };
};
