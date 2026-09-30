import { nowProxy } from '#gateway/node/Date/now/now.proxy';
import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questWaitForSessionStampBrokerProxy = (): {
  setupNow: (params: { ms: number }) => void;
  setupNowOnce: (params: { ms: number }) => void;
  setupSeedQuest: (params: { quest: Quest }) => void;
  setupRefreshedQuest: (params: { quest: Quest }) => void;
  setupLoadFailure: (params: { questId: Quest['id']; error: Error }) => void;
} => {
  const orchestrator = StartOrchestratorProxy();
  const clock = nowProxy();
  // The poll delay keeps its real timer; composed for enforce-proxy-child-creation.
  setTimeoutProxy();

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
    setupLoadFailure: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      orchestrator.loadQuestThrows({ questId, error });
    },
  };
};
