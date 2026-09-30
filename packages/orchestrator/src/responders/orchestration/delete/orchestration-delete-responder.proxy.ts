import type { Guild } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questDeleteBrokerProxy } from '../../../brokers/quest/delete/quest-delete-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { OrchestrationDeleteResponder } from './orchestration-delete-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationDeleteResponderProxy = (): {
  callResponder: typeof OrchestrationDeleteResponder;
  setupQuestFound: (params: { quest: Quest; guildId: Guild['id'] }) => void;
  setupQuestNotFound: () => void;
} => {
  const getProxy = questGetBrokerProxy();
  const deleteProxy = questDeleteBrokerProxy();

  return {
    callResponder: OrchestrationDeleteResponder,

    setupQuestFound: ({ quest, guildId }: { quest: Quest; guildId: Guild['id'] }): void => {
      getProxy.setupQuestFound({ quest });
      const homePath = '/home/testuser/.dungeonmaster';
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.id}`;
      deleteProxy.setupQuestFolderPath({ homePath, guildId, questId: quest.id, questFolderPath });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
  };
};
