import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { runIdMockStatics } from '../../../statics/run-id-mock/run-id-mock-statics';
import { storageSaveBrokerProxy } from '../../storage/save/storage-save-broker.proxy';
import { storagePruneBrokerProxy } from '../../storage/prune/storage-prune-broker.proxy';
import { storageLoadBrokerProxy } from '../../storage/load/storage-load-broker.proxy';

export const commandRunLayerMultiBrokerProxy = (): {
  setupSpawnAndLoad: (params: { packageCount: number; subResultContent: string }) => void;
} => {
  jest.spyOn(Date, 'now').mockReturnValue(runIdMockStatics.timestamp);
  jest.spyOn(Math, 'random').mockReturnValue(runIdMockStatics.randomValue);

  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const saveProxy = storageSaveBrokerProxy();
  const pruneProxy = storagePruneBrokerProxy();
  const loadProxy = storageLoadBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });

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
  };
};
