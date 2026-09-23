import { NextStepStub } from '../../../contracts/next-step/next-step.stub';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { AdapterResultStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { questGetNextStepBroker } from '../get-next-step/quest-get-next-step-broker';
import { questGetNextStepBrokerProxy } from '../get-next-step/quest-get-next-step-broker.proxy';
import { questRunStepBrokerProxy } from '../run-step/quest-run-step-broker.proxy';
import { spawnBatchLayerBroker } from './spawn-batch-layer-broker';
import { spawnBatchLayerBrokerProxy } from './spawn-batch-layer-broker.proxy';

// The loop is pure dispatch glue over these two brokers — mock them at the module boundary so
// tests drive the switch directly (each has its own test suite for the deep behavior). `run-step`
// runs through questRunStepBrokerProxy's own composed mocking instead, below.
registerModuleMock({ module: '../get-next-step/quest-get-next-step-broker' });
registerModuleMock({ module: './spawn-batch-layer-broker' });

// The questRunStepBrokerProxy child (instantiated below for the dependency-discovery lint)
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
  getSpawnBatchCalls: () => readonly unknown[];
  getNextStepCalls: () => readonly unknown[];
} => {
  // Instantiate the child proxies so their mock chains stay wired (dependency-discovery lint).
  questGetNextStepBrokerProxy();
  questRunStepBrokerProxy();
  spawnBatchLayerBrokerProxy();

  const getNextStepMock = registerMock({ fn: questGetNextStepBroker });
  const spawnBatchMock = registerMock({ fn: spawnBatchLayerBroker });

  // Neither real call carries an argument this loop branches on: questGetNextStepBroker is called
  // with the SAME static shape on every recursion, and the loop discards whatever
  // spawnBatchLayerBroker resolves to regardless of which queued step triggered the call — it just
  // proceeds to the next recursion either way. `[]` is the honest address for both defaults.
  getNextStepMock.calledWith([]).resolves(NextStepStub());
  spawnBatchMock.calledWith([]).resolves(AdapterResultStub());

  return {
    // One queued step per recursion. questGetNextStepBroker's call carries no argument that
    // distinguishes "which recursion" — the loop itself is what advances — so each queued step
    // is a live one-shot at the same `[]` address, consumed in the order staged.
    queueStep: ({ step }: { step: NextStep }): void => {
      getNextStepMock.onceFor([]).resolves(step);
    },

    getSpawnBatchCalls: (): readonly unknown[] =>
      spawnBatchMock.callsMatching([]).map((call) => call[0]),

    getNextStepCalls: (): readonly unknown[] =>
      getNextStepMock.callsMatching([]).map((call) => call[0]),
  };
};
