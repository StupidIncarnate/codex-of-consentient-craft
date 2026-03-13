import { AssistantToolUseStreamLineStub, type ExitCode } from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBrokerProxy } from '../spawn-by-role/agent-spawn-by-role-broker.proxy';

export const agentParallelRunnerBrokerProxy = (): {
  setupAllSpawnsSucceed: (params: { exitCode: ExitCode }) => void;
  setupAllSpawnsComplete: (params: { exitCode: ExitCode }) => void;
  setupSpawnFailure: () => void;
  setupMixedOutcomes: (params: { exitCode: ExitCode; leadingFailureCount: number }) => void;
} => {
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  return {
    setupAllSpawnsSucceed: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnProxy.setupSpawnAndMonitor({ lines: [], exitCode });
    },

    setupAllSpawnsComplete: ({ exitCode }: { exitCode: ExitCode }): void => {
      const signalLine = JSON.stringify(
        AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
                  summary: 'Done',
                },
              },
            ],
          },
        }),
      );
      spawnProxy.setupSpawnAndMonitor({ lines: [signalLine], exitCode });
    },

    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnFailure();
    },

    setupMixedOutcomes: ({
      exitCode,
      leadingFailureCount,
    }: {
      exitCode: ExitCode;
      leadingFailureCount: number;
    }): void => {
      spawnProxy.setupSpawnAndMonitor({ lines: [], exitCode });
      Array.from({ length: leadingFailureCount }).forEach(() => {
        spawnProxy.setupSpawnFailureOnce();
      });
    },
  };
};
