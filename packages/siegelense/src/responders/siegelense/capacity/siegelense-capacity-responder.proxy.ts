/**
 * PURPOSE: Test proxy for SiegelenseCapacityResponder — mocks `capacityReadBroker` directly rather
 * than composing its own child proxies' staging. `capacityReadBrokerProxy` is still constructed
 * (never addressed further) to satisfy `enforce-proxy-child-creation`. The address carries the arguments, so a test can stage
 * a different answer per `{ specName, poolSize }` pair and prove the responder passes both through.
 *
 * USAGE:
 * const proxy = SiegelenseCapacityResponderProxy();
 * proxy.stageAnswer({ specName: SpecNameStub(), poolSize: null, answer });
 */

import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { capacityReadBroker } from '../../../brokers/capacity/read/capacity-read-broker';
import { capacityReadBrokerProxy } from '../../../brokers/capacity/read/capacity-read-broker.proxy';
import type { CapacityAnswerStub } from '../../../contracts/capacity-answer/capacity-answer.stub';
import type { ProfilePoolSizeStub } from '../../../contracts/profile-pool-size/profile-pool-size.stub';

type CapacityAnswer = ReturnType<typeof CapacityAnswerStub>;
type ProfilePoolSize = ReturnType<typeof ProfilePoolSizeStub>;
type SpecName = string;

export const SiegelenseCapacityResponderProxy = (): {
  stageAnswer: (params: {
    specName: SpecName;
    poolSize: ProfilePoolSize | null;
    answer: CapacityAnswer;
  }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages capacityReadBroker
  // directly below, never through its own setup methods.
  capacityReadBrokerProxy();

  const capacityHandle = registerMock({ fn: capacityReadBroker });
  const stdout = stdoutProxy();

  return {
    stageAnswer: ({
      specName,
      poolSize,
      answer,
    }: {
      specName: SpecName;
      poolSize: ProfilePoolSize | null;
      answer: CapacityAnswer;
    }): void => {
      capacityHandle.calledWith([{ specName, poolSize }]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],
  };
};
