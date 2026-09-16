/**
 * PURPOSE: Test proxy for SiegelenseResultsResponder — mocks `resultsReadBroker` directly rather
 * than composing its own child proxies' staging, matching `SiegelenseStartResponderProxy`'s shape
 * for the sibling command. `resultsReadBrokerProxy` is still constructed (never addressed further)
 * to satisfy `enforce-proxy-child-creation`. `getWrittenAnswer` parses the captured write itself, so
 * a test asserting "the parsed document" never needs its own `unknown`-to-`string` narrowing.
 *
 * USAGE:
 * const proxy = SiegelenseResultsResponderProxy();
 * proxy.stageAnswer({ answer });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { resultsReadBroker } from '../../../brokers/results/read/results-read-broker';
import { resultsReadBrokerProxy } from '../../../brokers/results/read/results-read-broker.proxy';
import type { ResultsAnswerStub } from '../../../contracts/results-answer/results-answer.stub';

type ResultsAnswer = ReturnType<typeof ResultsAnswerStub>;

export const SiegelenseResultsResponderProxy = (): {
  stageAnswer: (params: { answer: ResultsAnswer }) => void;
  stageError: (params: { error: Error }) => void;
  getStdoutWrites: () => unknown[];
  getWrittenAnswer: () => unknown;
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages resultsReadBroker
  // directly below, never through its own setup methods.
  resultsReadBrokerProxy();

  const resultsReadHandle = registerMock({ fn: resultsReadBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageAnswer: ({ answer }: { answer: ResultsAnswer }): void => {
      resultsReadHandle.calledWith([]).resolves(answer);
    },

    stageError: ({ error }: { error: Error }): void => {
      resultsReadHandle.calledWith([]).rejects(error);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),

    getWrittenAnswer: (): unknown => {
      const writes = stdoutHandle.callsMatching([]).map((call) => call[0]);
      return JSON.parse(String(writes[writes.length - 1]));
    },
  };
};
