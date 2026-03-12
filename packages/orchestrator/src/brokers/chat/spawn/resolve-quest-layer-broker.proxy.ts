import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { questAddBrokerProxy } from '../../quest/add/quest-add-broker.proxy';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const resolveQuestLayerBrokerProxy = (): {
  setupQuestCreation: () => void;
  setupQuestCreationFailure: () => void;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
} => {
  const questAddProxy = questAddBrokerProxy();
  const questGetProxy = questGetBrokerProxy();

  return {
    setupQuestCreation: (): void => {
      // Default quest add mock already set by questAddBrokerProxy
    },

    setupQuestCreationFailure: (): void => {
      const questsFolderPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/quests',
      });
      questAddProxy.setupQuestCreationFailure({
        questsFolderPath,
        error: new Error('mkdir failed'),
      });
    },

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      questGetProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      questGetProxy.setupEmptyFolder();
    },
  };
};
