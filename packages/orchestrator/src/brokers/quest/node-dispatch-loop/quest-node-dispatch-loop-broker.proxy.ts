import { NextStepStub } from '../../../contracts/next-step/next-step.stub';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { QuestRunRiftcarverResultStub } from '../../../contracts/quest-run-riftcarver-result/quest-run-riftcarver-result.stub';
import { QuestRunWardResultStub } from '../../../contracts/quest-run-ward-result/quest-run-ward-result.stub';
import { AdapterResultStub, errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { questGetNextStepBroker } from '../get-next-step/quest-get-next-step-broker';
import { questGetNextStepBrokerProxy } from '../get-next-step/quest-get-next-step-broker.proxy';
import { questRunRiftcarverBroker } from '../run-riftcarver/quest-run-riftcarver-broker';
import { questRunRiftcarverBrokerProxy } from '../run-riftcarver/quest-run-riftcarver-broker.proxy';
import { questRunWardBroker } from '../run-ward/quest-run-ward-broker';
import { questRunWardBrokerProxy } from '../run-ward/quest-run-ward-broker.proxy';
import { spawnBatchLayerBroker } from './spawn-batch-layer-broker';
import { spawnBatchLayerBrokerProxy } from './spawn-batch-layer-broker.proxy';

// The loop is pure dispatch glue over these four brokers — mock them at the module boundary
// so tests drive the switch directly (each has its own test suite for the deep behavior).
registerModuleMock({ module: '../get-next-step/quest-get-next-step-broker' });
registerModuleMock({ module: '../run-ward/quest-run-ward-broker' });
registerModuleMock({ module: '../run-riftcarver/quest-run-riftcarver-broker' });
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
  getRunRiftcarverCalls: () => readonly unknown[];
  getSpawnBatchCalls: () => readonly unknown[];
  getNextStepCalls: () => readonly unknown[];
  // Stages what the carve streams through the `onLine` the loop hands it, so a test can assert the
  // LINES that reach onRiftcarverLine rather than that a function was passed.
  setupCarveOutput: (params: { lines: readonly string[] }) => void;
} => {
  // Instantiate the child proxies so their mock chains stay wired (dependency-discovery lint).
  questGetNextStepBrokerProxy();
  questRunWardBrokerProxy();
  questRunRiftcarverBrokerProxy();
  spawnBatchLayerBrokerProxy();

  const getNextStepMock = registerMock({ fn: questGetNextStepBroker });
  const runWardMock = registerMock({ fn: questRunWardBroker });
  const runRiftcarverMock = registerMock({ fn: questRunRiftcarverBroker });
  const spawnBatchMock = registerMock({ fn: spawnBatchLayerBroker });

  // None of the four real calls carry an argument this loop branches on: questGetNextStepBroker
  // is called with the SAME static shape on every recursion, and the loop discards whatever
  // questRunWardBroker/questRunRiftcarverBroker/spawnBatchLayerBroker resolve to regardless of
  // which queued step triggered the call — it just proceeds to the next recursion either way. `[]`
  // is the honest address for all four defaults.
  getNextStepMock.calledWith([]).resolves(NextStepStub());
  runWardMock.calledWith([]).resolves(QuestRunWardResultStub());
  spawnBatchMock.calledWith([]).resolves(AdapterResultStub());

  // The carve replays its staged output through the `onLine` the loop handed it, exactly as the
  // real broker's stream funnel does. Without this the loop's callback is never invoked and a
  // streaming test could only assert that a function was passed — the false positive the required
  // callback exists to prevent.
  const carveLines: ErrorMessage[] = [];
  const runRiftcarverImpl = async (
    params: Parameters<typeof questRunRiftcarverBroker>[0],
  ): Promise<ReturnType<typeof QuestRunRiftcarverResultStub>> => {
    for (const line of carveLines) {
      params.onLine(String(line));
    }
    return Promise.resolve(QuestRunRiftcarverResultStub());
  };
  runRiftcarverMock.calledWith([]).implement(runRiftcarverImpl as never);

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

    getRunRiftcarverCalls: (): readonly unknown[] =>
      runRiftcarverMock.callsMatching([]).map((call) => call[0]),

    // Staged BEFORE the loop runs: the lines are replayed through the `onLine` the loop builds,
    // during the call, so what a test observes is the real callback wiring rather than a replay a
    // test performed for itself afterwards.
    setupCarveOutput: ({ lines }: { lines: readonly string[] }): void => {
      carveLines.length = 0;
      carveLines.push(...lines.map((line) => errorMessageContract.parse(line)));
    },

    getSpawnBatchCalls: (): readonly unknown[] =>
      spawnBatchMock.callsMatching([]).map((call) => call[0]),

    getNextStepCalls: (): readonly unknown[] =>
      getNextStepMock.callsMatching([]).map((call) => call[0]),
  };
};
