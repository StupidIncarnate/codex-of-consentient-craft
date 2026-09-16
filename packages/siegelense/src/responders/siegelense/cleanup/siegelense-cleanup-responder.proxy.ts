/**
 * PURPOSE: Test proxy for SiegelenseCleanupResponder — mocks `cleanupRunBroker` directly rather
 * than composing its own child proxies' staging, matching `SiegelenseFleetResponderProxy`'s shape
 * for the sibling command. `cleanupRunBrokerProxy` is still constructed (never addressed further)
 * to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseCleanupResponderProxy();
 * proxy.stageAnswer({ answer });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { cleanupRunBroker } from '../../../brokers/cleanup/run/cleanup-run-broker';
import { cleanupRunBrokerProxy } from '../../../brokers/cleanup/run/cleanup-run-broker.proxy';
import type { CleanupAnswerStub } from '../../../contracts/cleanup-answer/cleanup-answer.stub';

type CleanupAnswer = ReturnType<typeof CleanupAnswerStub>;

export const SiegelenseCleanupResponderProxy = (): {
  stageAnswer: (params: { answer: CleanupAnswer }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages cleanupRunBroker
  // directly below, never through its own setup methods.
  cleanupRunBrokerProxy();

  const cleanupRunHandle = registerMock({ fn: cleanupRunBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageAnswer: ({ answer }: { answer: CleanupAnswer }): void => {
      cleanupRunHandle.calledWith([]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
