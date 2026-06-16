import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';

import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const recoverOrphanedWorkItemsLayerBrokerProxy = (): {
  setupModifyForQuest: (params: { quest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Quest;
} => {
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupModifyForQuest: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
    getLastPersistedQuest: (): Quest => {
      const persisted = modifyProxy.getAllPersistedContents();
      const last = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(last)));
    },
  };
};
