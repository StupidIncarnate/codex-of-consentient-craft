/**
 * PURPOSE: Test proxy for SiegelenseResultsResponder — mocks `registryReadBroker` and
 * `resultsReadBroker` directly rather than composing either's own child proxies' staging, matching
 * `SiegelenseKillResponderProxy`'s shape for the registry-miss check. `resultsReadBrokerProxy` is
 * still constructed (never addressed further) to satisfy `enforce-proxy-child-creation`.
 * `getWrittenAnswer` parses the captured write itself, so a test asserting "the parsed document"
 * never needs its own `unknown`-to-`string` narrowing.
 *
 * USAGE:
 * const proxy = SiegelenseResultsResponderProxy();
 * proxy.stageRegistry({ registry });
 * proxy.stageAnswer({ answer });
 */

import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import { resultsReadBroker } from '../../../brokers/results/read/results-read-broker';
import { resultsReadBrokerProxy } from '../../../brokers/results/read/results-read-broker.proxy';
import type { ResultsAnswerStub } from '../../../contracts/results-answer/results-answer.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';

type ResultsAnswer = ReturnType<typeof ResultsAnswerStub>;
type Registry = ReturnType<typeof RegistryStub>;

// The query is built by the responder from its argv, so the address is its shape: an object.
const QUERY_ADDRESS = {
  query: (value: unknown): boolean => typeof value === 'object' && value !== null,
};

export const SiegelenseResultsResponderProxy = (): {
  stageRegistry: (params: { registry: Registry }) => void;
  stageAnswer: (params: { answer: ResultsAnswer }) => void;
  stageError: (params: { error: Error }) => void;
  getStdoutWrites: () => unknown[];
  getWrittenAnswer: () => unknown;
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages resultsReadBroker
  // directly below, never through its own setup methods.
  resultsReadBrokerProxy();
  registryReadBrokerProxy();

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const resultsReadHandle = registerMock({ fn: resultsReadBroker });
  const stdout = stdoutProxy();

  return {
    stageRegistry: ({ registry }: { registry: Registry }): void => {
      registryReadHandle.calledWith([]).resolves(registry);
    },

    stageAnswer: ({ answer }: { answer: ResultsAnswer }): void => {
      resultsReadHandle.calledWith([QUERY_ADDRESS]).resolves(answer);
    },

    stageError: ({ error }: { error: Error }): void => {
      resultsReadHandle.calledWith([QUERY_ADDRESS]).rejects(error);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],

    getWrittenAnswer: (): unknown => {
      const writes = [...stdout.getWrites()];
      return JSON.parse(String(writes[writes.length - 1]));
    },
  };
};
