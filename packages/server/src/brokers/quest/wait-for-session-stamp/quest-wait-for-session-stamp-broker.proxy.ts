import type { QuestId, QuestStub } from '@dungeonmaster/shared/contracts';

import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questWaitForSessionStampBrokerProxy = (): {
  setupSeedQuest: (params: { quest: Quest }) => void;
  setupRefreshedQuest: (params: { quest: Quest }) => void;
  setupLoadFailure: (params: { questId: QuestId; error: Error }) => void;
} => {
  const loadProxy = orchestratorLoadQuestAdapterProxy();

  return {
    setupSeedQuest: ({ quest }: { quest: Quest }): void => {
      loadProxy.returns({ questId: quest.id, quest });
    },
    setupRefreshedQuest: ({ quest }: { quest: Quest }): void => {
      loadProxy.returns({ questId: quest.id, quest });
    },
    setupLoadFailure: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      loadProxy.throws({ questId, error });
    },
  };
};
