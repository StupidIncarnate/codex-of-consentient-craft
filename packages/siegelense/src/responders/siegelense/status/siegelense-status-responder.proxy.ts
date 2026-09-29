/**
 * PURPOSE: Test proxy for SiegelenseStatusResponder — mocks `registryReadBroker` and
 * `statusReadBroker` directly rather than composing either's own child proxies' staging, matching
 * `SiegelenseKillResponderProxy`'s shape for the registry-miss check. `statusReadBrokerProxy` is
 * still constructed (never addressed further) to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseStatusResponderProxy();
 * proxy.stageRegistry({ registry });
 * proxy.stageAnswer({ answer });
 */

import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { statusReadBroker } from '../../../brokers/status/read/status-read-broker';
import { statusReadBrokerProxy } from '../../../brokers/status/read/status-read-broker.proxy';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import type { StatusAnswerStub } from '../../../contracts/status-answer/status-answer.stub';
import type { RegistryStub } from '../../../contracts/registry/registry.stub';

type StatusAnswer = ReturnType<typeof StatusAnswerStub>;
type Registry = ReturnType<typeof RegistryStub>;

export const SiegelenseStatusResponderProxy = (): {
  stageRegistry: (params: { registry: Registry }) => void;
  stageAnswer: (params: { answer: StatusAnswer }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages statusReadBroker
  // directly below, never through its own setup methods.
  statusReadBrokerProxy();
  registryReadBrokerProxy();

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const statusReadHandle = registerMock({ fn: statusReadBroker });
  const stdout = stdoutProxy();

  return {
    stageRegistry: ({ registry }: { registry: Registry }): void => {
      registryReadHandle.calledWith([]).resolves(registry);
    },

    stageAnswer: ({ answer }: { answer: StatusAnswer }): void => {
      statusReadHandle.calledWith([]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],
  };
};
