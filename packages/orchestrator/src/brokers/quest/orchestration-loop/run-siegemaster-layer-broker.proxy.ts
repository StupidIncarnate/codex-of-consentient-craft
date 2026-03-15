import type { ExitCode, QuestStub } from '@dungeonmaster/shared/contracts';

import { agentParallelRunnerBrokerProxy } from '../../agent/parallel-runner/agent-parallel-runner-broker.proxy';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runSiegemasterLayerBrokerProxy = (): {
  setupAllComplete: (params: { quest: Quest; exitCode: ExitCode }) => void;
  setupAllSucceedWithoutSignal: (params: { quest: Quest; exitCode: ExitCode }) => void;
} => {
  const loadProxy = questLoadBrokerProxy();
  agentSpawnByRoleBrokerProxy();
  const parallelProxy = agentParallelRunnerBrokerProxy();

  return {
    setupAllComplete: ({ quest, exitCode }: { quest: Quest; exitCode: ExitCode }): void => {
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
      parallelProxy.setupAllSpawnsComplete({ exitCode });
    },

    setupAllSucceedWithoutSignal: ({
      quest,
      exitCode,
    }: {
      quest: Quest;
      exitCode: ExitCode;
    }): void => {
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
      parallelProxy.setupAllSpawnsSucceed({ exitCode });
    },
  };
};
