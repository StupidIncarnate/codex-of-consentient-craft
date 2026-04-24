import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { questDeleteBrokerProxy } from '../../../brokers/quest/delete/quest-delete-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { OrchestrationDeleteResponder } from './orchestration-delete-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationDeleteResponderProxy = (): {
  callResponder: typeof OrchestrationDeleteResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
} => {
  const getProxy = questGetBrokerProxy();
  const deleteProxy = questDeleteBrokerProxy();

  return {
    callResponder: OrchestrationDeleteResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${quest.id}`,
      });
      deleteProxy.setupQuestFolderPath({ homePath, questFolderPath });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
  };
};
