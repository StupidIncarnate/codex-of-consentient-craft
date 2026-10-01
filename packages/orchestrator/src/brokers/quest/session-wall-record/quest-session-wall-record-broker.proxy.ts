import type { Quest } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';

type QuestInput = ReturnType<typeof QuestStub>;

export const questSessionWallRecordBrokerProxy = (): {
  setupQuest: (params: { quest: QuestInput }) => void;
  getAllPersistedQuests: () => readonly Quest[];
} => {
  const updateProxy = questOperationsUpdateBrokerProxy();

  return {
    setupQuest: ({ quest }: { quest: QuestInput }): void => {
      updateProxy.setupQuestOnDisk({ quest });
    },

    getAllPersistedQuests: (): readonly Quest[] => updateProxy.getAllPersistedQuests(),
  };
};
