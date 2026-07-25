import { childProcessSpawnStreamAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';
import { commandRunLayerChildCrashBrokerProxy } from './command-run-layer-child-crash-broker.proxy';

const CHILD_RUN_ID = '1739625600000-a38e';
// Matches what a child ward actually prints — id plus the trailing total-duration suffix.
const CHILD_SUMMARY_LINE = `run: ${CHILD_RUN_ID}  (1.2s)\n`;

export const commandRunLayerMultiBrokerProxy = (): {
  setupSpawnAndLoad: (params: { packageCount: number; subResultContent: string }) => void;
  setupSpawnAndLoadSelective: (params: { packages: { subResultContent: string }[] }) => void;
  setupSpawnWithNullLoad: () => void;
  setupNoSpawns: () => void;
  getStderrCalls: () => unknown[];
  getAllSpawnedArgs: () => unknown[];
} => {
  registerSpyOn({ object: Date, method: 'now' }).mockReturnValue(runIdMockStatics.timestamp);
  registerSpyOn({ object: Math, method: 'random' }).mockReturnValue(runIdMockStatics.randomValue);
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.mockImplementation(() => true);

  const streamProxy = childProcessSpawnStreamAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();
  const loadProxy = storageLoadBrokerProxy();
  commandRunLayerChildCrashBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });

  return {
    setupSpawnAndLoad: ({
      packageCount,
      subResultContent,
    }: {
      packageCount: number;
      subResultContent: string;
    }): void => {
      binProxy.setupFound();
      Array.from({ length: packageCount }).forEach(() => {
        streamProxy.setupSuccess({
          exitCode: successCode,
          stdout: CHILD_SUMMARY_LINE,
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
      binProxy.setupFound();
      for (const pkg of packages) {
        streamProxy.setupSuccess({
          exitCode: successCode,
          stdout: CHILD_SUMMARY_LINE,
          stderr: '',
        });
        loadProxy.setupRunById({ content: pkg.subResultContent });
      }
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupSpawnWithNullLoad: (): void => {
      binProxy.setupFound();
      streamProxy.setupSuccess({
        exitCode: ExitCodeStub({ value: 1 }),
        stdout: CHILD_SUMMARY_LINE,
        stderr: '',
      });
      loadProxy.setupReadFail({ error: new Error('ENOENT') });
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    setupNoSpawns: (): void => {
      binProxy.setupFound();
      saveProxy.setupSuccess();
      pruneProxy.setupEmpty();
    },
    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),
    getAllSpawnedArgs: (): unknown[] => streamProxy.getAllSpawnedArgs(),
  };
};
