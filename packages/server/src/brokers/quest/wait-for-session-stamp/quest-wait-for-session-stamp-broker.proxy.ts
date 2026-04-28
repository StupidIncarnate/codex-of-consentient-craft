import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { orchestratorLoadQuestAdapterProxy } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questWaitForSessionStampBrokerProxy = (): {
  setupSeedQuest: (params: { quest: Quest }) => void;
  setupRefreshedQuest: (params: { quest: Quest }) => void;
  setupLoadFailure: (params: { error: Error }) => void;
} => {
  const loadProxy = orchestratorLoadQuestAdapterProxy();

  return {
    setupSeedQuest: ({ quest }: { quest: Quest }): void => {
      loadProxy.returns({ quest });
    },
    setupRefreshedQuest: ({ quest }: { quest: Quest }): void => {
      loadProxy.returns({ quest });
    },
    setupLoadFailure: ({ error }: { error: Error }): void => {
      loadProxy.throws({ error });
    },
  };
};
