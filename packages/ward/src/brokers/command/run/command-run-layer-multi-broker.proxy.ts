import { childProcessSpawnStreamAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import type { spawn } from 'child_process';

import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

const CHILD_RUN_ID = '1739625600000-a38e';

export const commandRunLayerMultiBrokerProxy = (): {
  setupSpawnAndLoad: (params: { packageCount: number; subResultContent: string }) => void;
  setupSpawnAndLoadSelective: (params: { packages: { subResultContent: string }[] }) => void;
  setupSpawnWithNullLoad: () => void;
  setupNoSpawns: () => void;
  getStderrCalls: () => unknown[];
  getAllSpawnedArgs: () => unknown[];
} => {
  jest.spyOn(Date, 'now').mockReturnValue(runIdMockStatics.timestamp);
  jest.spyOn(Math, 'random').mockReturnValue(runIdMockStatics.randomValue);
  const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

  const streamProxy = childProcessSpawnStreamAdapterProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();
  const loadProxy = storageLoadBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });

  const spawnMock = jest.mocked(
    jest.requireMock<{ spawn: typeof spawn }>('child_process').spawn,
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
        streamProxy.setupSuccess({
          exitCode: successCode,
          stdout: `run: ${CHILD_RUN_ID}\n`,
          stderr: '',
        });
        loadProxy.setupRunById({ content: subResultContent });
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
        streamProxy.setupSuccess({
          exitCode: successCode,
          stdout: `run: ${CHILD_RUN_ID}\n`,
          stderr: '',
        });
        loadProxy.setupRunById({ content: pkg.subResultContent });
      }
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupSpawnWithNullLoad: (): void => {
      streamProxy.setupSuccess({
        exitCode: successCode,
        stdout: `run: ${CHILD_RUN_ID}\n`,
        stderr: '',
      });
      loadProxy.setupReadFail({ error: new Error('ENOENT') });
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupNoSpawns: (): void => {
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),
    getAllSpawnedArgs: (): unknown[] =>
      spawnMock.mock.calls.map((call) => Reflect.get(call as object, 1)),
  };
};
