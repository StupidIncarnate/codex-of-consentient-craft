import { NextStepStub } from '../../../contracts/next-step/next-step.stub';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { QuestRunWardResultStub } from '../../../contracts/quest-run-ward-result/quest-run-ward-result.stub';
import { AdapterResultStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

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

// The questRunWardBrokerProxy child (instantiated below for the dependency-discovery lint)
// unconditionally wires its virtual fs store onto these shared-package functions in its
// constructor. Its own bare automocks degrade to selective mocks when merged with the
// identifier-level registerMock calls contributed by the OTHER proxies this file composes, which
// would leave those functions un-mocked here. Explicit factories always win the hoist merge, so
// they are guaranteed jest.fn()s in this composition context.
registerModuleMock({
  module: '@dungeonmaster/shared/adapters',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/adapters'),
    childProcessSpawnCaptureAdapter: jest.fn(),
    childProcessSpawnStreamLinesAdapter: jest.fn(),
    fsMkdirAdapter: jest.fn(),
    fsReaddirWithTypesAdapter: jest.fn(),
    pathJoinAdapter: jest.fn(),
    processCwdAdapter: jest.fn(),
  }),
});
registerModuleMock({
  module: '@dungeonmaster/shared/brokers',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/brokers'),
    cwdResolveBroker: jest.fn(),
    dungeonmasterHomeFindBroker: jest.fn(),
  }),
});

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

  const getNextStepMock = registerMock({ fn: questGetNextStepBroker });
  const runWardMock = registerMock({ fn: questRunWardBroker });
  const spawnBatchMock = registerMock({ fn: spawnBatchLayerBroker });

  // None of the three real calls carry an argument this loop branches on: questGetNextStepBroker
  // is called with the SAME static shape on every recursion, and the loop discards whatever
  // questRunWardBroker/spawnBatchLayerBroker resolve to regardless of which queued step triggered
  // the call — it just proceeds to the next recursion either way. `[]` is the honest address for
  // all three defaults.
  getNextStepMock.calledWith([]).resolves(NextStepStub());
  runWardMock.calledWith([]).resolves(QuestRunWardResultStub());
  spawnBatchMock.calledWith([]).resolves(AdapterResultStub());

  return {
    // One queued step per recursion. questGetNextStepBroker's call carries no argument that
    // distinguishes "which recursion" — the loop itself is what advances — so each queued step
    // is a live one-shot at the same `[]` address, consumed in the order staged.
    queueStep: ({ step }: { step: NextStep }): void => {
      getNextStepMock.onceFor([]).resolves(step);
    },

    // Tests assert the FULL ordered sequence of calls across every recursion (e.g. two queued
    // spawn-agents steps => two batches dispatched in order), so callsMatching([]) — every call,
    // unfiltered — is what "the calls this loop made" actually means here, not a single address.
    getRunWardCalls: (): readonly unknown[] => runWardMock.callsMatching([]).map((call) => call[0]),

    getSpawnBatchCalls: (): readonly unknown[] =>
      spawnBatchMock.callsMatching([]).map((call) => call[0]),

    getNextStepCalls: (): readonly unknown[] =>
      getNextStepMock.callsMatching([]).map((call) => call[0]),
  };
};
