import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import type { execFile } from 'child_process';

import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

export const commandRunLayerMultiBrokerProxy = (): {
  setupSpawnAndLoad: (params: { packageCount: number; subResultContent: string }) => void;
  setupSpawnAndLoadSelective: (params: { packages: { subResultContent: string }[] }) => void;
  setupNoSpawns: () => void;
  getStderrCalls: () => unknown[];
  getAllSpawnedArgs: () => unknown[];
} => {
  jest.spyOn(Date, 'now').mockReturnValue(runIdMockStatics.timestamp);
  jest.spyOn(Math, 'random').mockReturnValue(runIdMockStatics.randomValue);
  const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();
  const loadProxy = storageLoadBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });

  const execFileMock = jest.mocked(
    jest.requireMock<{ execFile: typeof execFile }>('child_process').execFile,
  ) as jest.Mock;

  return {
    setupSpawnAndLoad: ({
      packageCount,
      subResultContent,
    }: {
      packageCount: number;
      subResultContent: string;
    }): void => {
      Array.from({ length: packageCount }).forEach(() => {
        captureProxy.setupSuccess({ exitCode: successCode, stdout: '', stderr: '' });
        loadProxy.setupLatestRun({
          entries: ['run-1739625600000-a38e.json'],
          content: subResultContent,
        });
      });
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupSpawnAndLoadSelective: ({
      packages,
    }: {
      packages: { subResultContent: string }[];
    }): void => {
      for (const pkg of packages) {
        captureProxy.setupSuccess({ exitCode: successCode, stdout: '', stderr: '' });
        loadProxy.setupLatestRun({
          entries: ['run-1739625600000-a38e.json'],
          content: pkg.subResultContent,
        });
      }
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupNoSpawns: (): void => {
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),
    getAllSpawnedArgs: (): unknown[] =>
      execFileMock.mock.calls.map((call) => Reflect.get(call as object, 1)),
  };
};
