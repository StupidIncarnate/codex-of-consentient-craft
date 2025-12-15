/**
 * Proxy for StartCli integration tests
 */

import { questListBrokerProxy } from '../brokers/quest/list/quest-list-broker.proxy';
import { agentSpawnBrokerProxy } from '../brokers/agent/spawn/agent-spawn-broker.proxy';
import { exitCodeContract, filePathContract, type ExitCode } from '@dungeonmaster/shared/contracts';

export const StartCliProxy = (): {
  setupAgentSuccess: (params?: { exitCode?: ExitCode }) => void;
  setupAgentError: () => void;
  getProcessExitCalls: () => jest.SpyInstance;
} => {
  questListBrokerProxy();

  const agentProxy = agentSpawnBrokerProxy();

  // Mock process.exit to prevent actual process termination in tests
  const processExitMock = jest.spyOn(process, 'exit').mockImplementation((() => {
    // Throw error to simulate exit and allow test to catch it
    throw new Error('process.exit called');
  }) as never);

  return {
    setupAgentSuccess: ({ exitCode = exitCodeContract.parse(0) }: { exitCode?: ExitCode } = {}) => {
      agentProxy.setupSuccess({
        projectRoot: filePathContract.parse('/mock/project'),
        exitCode,
      });
    },
    setupAgentError: () => {
      agentProxy.setupError({
        projectRoot: filePathContract.parse('/mock/project'),
        error: new Error('Failed to spawn agent'),
      });
    },
    getProcessExitCalls: () => processExitMock,
  };
};
