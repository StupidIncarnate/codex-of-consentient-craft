import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { claudeSpawnBrokerProxy } from '../../claude/spawn/claude-spawn-broker.proxy';

export const chaoswhispererSpawnBrokerProxy = (): {
  setupSuccess: (params: { exitCode: ExitCode }) => void;
  setupSuccessWithNullExitCode: () => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
} => {
  const claudeProxy = claudeSpawnBrokerProxy();

  return {
    setupSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      claudeProxy.setupSuccess({ exitCode });
    },

    setupSuccessWithNullExitCode: (): void => {
      claudeProxy.setupSuccessWithNullExitCode();
    },

    setupError: ({ error }: { error: Error }): void => {
      claudeProxy.setupError({ error });
    },

    getSpawnedCommand: (): unknown => claudeProxy.getSpawnedCommand(),
  };
};
