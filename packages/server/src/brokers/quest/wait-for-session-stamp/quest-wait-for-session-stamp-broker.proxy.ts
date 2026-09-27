import type { QuestId, QuestStub } from '@dungeonmaster/shared/contracts';

import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questWaitForSessionStampBrokerProxy = (): {
  setupSeedQuest: (params: { quest: Quest }) => void;
  setupRefreshedQuest: (params: { quest: Quest }) => void;
  setupLoadFailure: (params: { questId: QuestId; error: Error }) => void;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupSeedQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupRefreshedQuest: ({ quest }: { quest: Quest }): void => {
      orchestrator.loadQuestReturns({ questId: quest.id, quest });
    },
    setupLoadFailure: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
    },
  };
};
