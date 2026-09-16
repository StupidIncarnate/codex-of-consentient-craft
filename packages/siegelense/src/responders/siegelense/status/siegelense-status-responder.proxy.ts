/**
 * PURPOSE: Test proxy for SiegelenseStatusResponder — mocks `statusReadBroker` directly rather than
 * composing its own child proxies' staging, matching `SiegelenseFleetResponderProxy`'s shape for
 * the sibling command. `statusReadBrokerProxy` is still constructed (never addressed further) to
 * satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseStatusResponderProxy();
 * proxy.stageAnswer({ answer });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { statusReadBroker } from '../../../brokers/status/read/status-read-broker';
import { statusReadBrokerProxy } from '../../../brokers/status/read/status-read-broker.proxy';
import type { StatusAnswerStub } from '../../../contracts/status-answer/status-answer.stub';

type StatusAnswer = ReturnType<typeof StatusAnswerStub>;

export const SiegelenseStatusResponderProxy = (): {
  stageAnswer: (params: { answer: StatusAnswer }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages statusReadBroker
  // directly below, never through its own setup methods.
  statusReadBrokerProxy();

  const statusReadHandle = registerMock({ fn: statusReadBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageAnswer: ({ answer }: { answer: StatusAnswer }): void => {
      statusReadHandle.calledWith([]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
