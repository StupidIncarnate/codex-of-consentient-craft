/**
 * PURPOSE: Test proxy for SiegelenseCapacityResponder — mocks `capacityReadBroker` directly rather
 * than composing its own child proxies' staging, matching `SiegelenseProfileResponderProxy`'s shape
 * for the sibling command. `capacityReadBrokerProxy` is still constructed (never addressed further)
 * to satisfy `enforce-proxy-child-creation`. The address carries the arguments, so a test can stage
 * a different answer per `{ specName, poolSize }` pair and prove the responder passes both through.
 *
 * USAGE:
 * const proxy = SiegelenseCapacityResponderProxy();
 * proxy.stageAnswer({ specName: SpecNameStub(), poolSize: null, answer });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { capacityReadBroker } from '../../../brokers/capacity/read/capacity-read-broker';
import { capacityReadBrokerProxy } from '../../../brokers/capacity/read/capacity-read-broker.proxy';
import type { CapacityAnswerStub } from '../../../contracts/capacity-answer/capacity-answer.stub';
import type { ProfilePoolSizeStub } from '../../../contracts/profile-pool-size/profile-pool-size.stub';
import type { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

type CapacityAnswer = ReturnType<typeof CapacityAnswerStub>;
type ProfilePoolSize = ReturnType<typeof ProfilePoolSizeStub>;
type SpecName = ReturnType<typeof SpecNameStub>;

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
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

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

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
