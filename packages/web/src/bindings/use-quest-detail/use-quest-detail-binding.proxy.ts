import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questDetailBrokerProxy } from '../../brokers/quest/detail/quest-detail-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const useQuestDetailBindingProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupError: (params: { error: Error }) => void;
} => {
  const brokerProxy = questDetailBrokerProxy();

  return {
    setupQuest: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuest({ quest });
    },
    setupError: ({ error }: { error: Error }): void => {
      brokerProxy.setupError({ error });
    },
  };
};
