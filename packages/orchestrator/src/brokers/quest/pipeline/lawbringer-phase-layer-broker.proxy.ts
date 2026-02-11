import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentParallelRunnerBrokerProxy } from '../../agent/parallel-runner/agent-parallel-runner-broker.proxy';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

export const lawbringerPhaseLayerBrokerProxy = (): {
  setupQuestFile: (params: { questJson: string }) => void;
  setupAllSpawnsSucceed: (params: { exitCode: ExitCode }) => void;
  setupSpawnFailure: () => void;
} => {
  const questProxy = questLoadBrokerProxy();
  agentSpawnByRoleBrokerProxy();
  const parallelProxy = agentParallelRunnerBrokerProxy();

  return {
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      questProxy.setupQuestFile({ questJson });
    },

    setupAllSpawnsSucceed: ({ exitCode }: { exitCode: ExitCode }): void => {
      parallelProxy.setupAllSpawnsSucceed({ exitCode });
    },

    setupSpawnFailure: (): void => {
      parallelProxy.setupSpawnFailure();
    },
  };
};
