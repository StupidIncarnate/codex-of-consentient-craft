import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import type { QuestId, QuestStub } from '@dungeonmaster/shared/contracts';

import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questWaitForSessionStampBrokerProxy = (): {
  setupNow: (params: { ms: number }) => void;
  setupNowOnce: (params: { ms: number }) => void;
  setupSeedQuest: (params: { quest: Quest }) => void;
  setupRefreshedQuest: (params: { quest: Quest }) => void;
  setupLoadFailure: (params: { questId: QuestId; error: Error }) => void;
} => {
  const orchestrator = StartOrchestratorProxy();
  const clock = nowProxy();

  return {
    setupNow: ({ ms }: { ms: number }): void => {
      clock.setupNow({ ms });
    },
    setupNowOnce: ({ ms }: { ms: number }): void => {
      clock.setupNowOnce({ ms });
    },
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
