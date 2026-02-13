import type { QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { questListBrokerProxy } from '../../brokers/quest/list/quest-list-broker.proxy';

type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const useQuestsBindingProxy = (): {
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupError: () => void;
} => {
  const brokerProxy = questListBrokerProxy();

  return {
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      brokerProxy.setupQuests({ quests });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
  };
};
