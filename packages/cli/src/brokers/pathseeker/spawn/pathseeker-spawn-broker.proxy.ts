import type { ExitCode, FilePath } from '@dungeonmaster/shared/contracts';

import { claudeSpawnBrokerProxy } from '../../claude/spawn/claude-spawn-broker.proxy';

export const pathseekerSpawnBrokerProxy = (): {
  setupSuccess: (params: { projectRoot: FilePath; exitCode: ExitCode }) => void;
  setupError: (params: { projectRoot: FilePath; error: Error }) => void;
} => {
  const claudeProxy = claudeSpawnBrokerProxy();

  return {
    setupSuccess: ({ projectRoot, exitCode }: { projectRoot: FilePath; exitCode: ExitCode }) => {
      claudeProxy.setupSuccess({ projectRoot, exitCode });
    },

    setupError: ({ projectRoot, error }: { projectRoot: FilePath; error: Error }) => {
      claudeProxy.setupError({ projectRoot, error });
    },
  };
};
