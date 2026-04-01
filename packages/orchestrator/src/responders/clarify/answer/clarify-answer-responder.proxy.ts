import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const ClarifyAnswerResponderProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
