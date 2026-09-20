/**
 * PURPOSE: Test proxy for SiegelenseCompareResponder — mocks `compareReadBroker` directly rather
 * than composing its own child proxies' staging, matching `SiegelenseResultsResponderProxy`'s shape
 * for the sibling command. `compareReadBrokerProxy` is still constructed (never addressed further)
 * to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseCompareResponderProxy();
 * proxy.stageAnswer({ answer });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { compareReadBroker } from '../../../brokers/compare/read/compare-read-broker';
import { compareReadBrokerProxy } from '../../../brokers/compare/read/compare-read-broker.proxy';
import type { CompareAnswerStub } from '../../../contracts/compare-answer/compare-answer.stub';

type CompareAnswer = ReturnType<typeof CompareAnswerStub>;

export const SiegelenseCompareResponderProxy = (): {
  stageAnswer: (params: { answer: CompareAnswer }) => void;
  stageError: (params: { error: Error }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages compareReadBroker
  // directly below, never through its own setup methods.
  compareReadBrokerProxy();

  const compareReadHandle = registerMock({ fn: compareReadBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageAnswer: ({ answer }: { answer: CompareAnswer }): void => {
      compareReadHandle.calledWith([]).resolves(answer);
    },

    stageError: ({ error }: { error: Error }): void => {
      compareReadHandle.calledWith([]).rejects(error);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
