import { NextStepStub } from '../../../contracts/next-step/next-step.stub';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
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

  // questGetNextStepBroker is called with the SAME static poll timings on every recursion (the
  // remaining arguments are the loop's own facade and pause predicate), so those two values are
  // its address. With nothing queued, the scan finds the default idle step and the loop returns.
  const nextStepAddress = {
    longPollTotalMs: orchestrationDispatchStatics.loop.longPollTotalMs,
    longPollIntervalMs: orchestrationDispatchStatics.loop.longPollIntervalMs,
  };
  getNextStepMock.calledWith([nextStepAddress]).resolves(NextStepStub());

  return {
    // One queued step per recursion: each is a live one-shot at the scan's address, consumed in the
    // order staged. A spawn step also stages the batch spawn for its own agents.
    queueStep: ({ step }: { step: NextStep }): void => {
      getNextStepMock.onceFor([nextStepAddress]).resolves(step);
      if (step.type === 'spawn-agents') {
        spawnBatchMock.calledWith([{ agents: step.agents }]).resolves(undefined);
      }
    },

    getSpawnBatchCalls: (): readonly unknown[] =>
      spawnBatchMock.callsMatching([]).map((call) => call[0]),

    getNextStepCalls: (): readonly unknown[] =>
      getNextStepMock.callsMatching([]).map((call) => call[0]),
  };
};
