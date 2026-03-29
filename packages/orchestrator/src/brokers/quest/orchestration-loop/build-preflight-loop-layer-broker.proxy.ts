import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { buildPreflightBrokerProxy } from '../../build/preflight/build-preflight-broker.proxy';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const buildPreflightLoopLayerBrokerProxy = (): {
  setupBuildSuccess: () => void;
  setupBuildFailure: (params: { exitCode: ExitCode; output: string }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
} => {
  const buildProxy = buildPreflightBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  return {
    setupBuildSuccess: (): void => {
      buildProxy.setupBuildSuccess();
    },
    setupBuildFailure: ({ exitCode, output }: { exitCode: ExitCode; output: string }): void => {
      buildProxy.setupBuildFailure({ exitCode, output });
    },
    setupSpawnOnce: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnOnce({ lines, exitCode });
    },
    setupSpawnAutoLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnAutoLines({ lines, exitCode });
    },
  };
};
