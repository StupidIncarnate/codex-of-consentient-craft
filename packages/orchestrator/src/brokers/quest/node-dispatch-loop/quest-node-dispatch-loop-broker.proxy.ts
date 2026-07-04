import { NextStepStub } from '../../../contracts/next-step/next-step.stub';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { QuestRunWardResultStub } from '../../../contracts/quest-run-ward-result/quest-run-ward-result.stub';
import { AdapterResultStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { questGetNextStepBroker } from '../get-next-step/quest-get-next-step-broker';
import { questGetNextStepBrokerProxy } from '../get-next-step/quest-get-next-step-broker.proxy';
import { questRunWardBroker } from '../run-ward/quest-run-ward-broker';
import { questRunWardBrokerProxy } from '../run-ward/quest-run-ward-broker.proxy';
import { spawnBatchLayerBroker } from './spawn-batch-layer-broker';
import { spawnBatchLayerBrokerProxy } from './spawn-batch-layer-broker.proxy';

// The loop is pure dispatch glue over these three brokers — mock them at the module boundary
// so tests drive the switch directly (each has its own test suite for the deep behavior).
registerModuleMock({ module: '../get-next-step/quest-get-next-step-broker' });
registerModuleMock({ module: '../run-ward/quest-run-ward-broker' });
registerModuleMock({ module: './spawn-batch-layer-broker' });

export const questNodeDispatchLoopBrokerProxy = (): {
  queueStep: (params: { step: NextStep }) => void;
  getRunWardCalls: () => readonly unknown[];
  getSpawnBatchCalls: () => readonly unknown[];
  getNextStepCalls: () => readonly unknown[];
} => {
  // Instantiate the child proxies so their mock chains stay wired (dependency-discovery lint).
  questGetNextStepBrokerProxy();
  questRunWardBrokerProxy();
  spawnBatchLayerBrokerProxy();
  const getNextStepMock = questGetNextStepBroker as jest.MockedFunction<
    typeof questGetNextStepBroker
  >;
  const runWardMock = questRunWardBroker as jest.MockedFunction<typeof questRunWardBroker>;
  const spawnBatchMock = spawnBatchLayerBroker as jest.MockedFunction<typeof spawnBatchLayerBroker>;

  getNextStepMock.mockResolvedValue(NextStepStub());
  runWardMock.mockResolvedValue(QuestRunWardResultStub());
  spawnBatchMock.mockResolvedValue(AdapterResultStub());

  return {
    queueStep: ({ step }: { step: NextStep }): void => {
      getNextStepMock.mockResolvedValueOnce(step);
    },

    getRunWardCalls: (): readonly unknown[] => runWardMock.mock.calls.map((call) => call[0]),

    getSpawnBatchCalls: (): readonly unknown[] => spawnBatchMock.mock.calls.map((call) => call[0]),

    getNextStepCalls: (): readonly unknown[] => getNextStepMock.mock.calls.map((call) => call[0]),
  };
};
