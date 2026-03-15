import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questWorkItemInsertBrokerProxy = (): {
  setupQuestModify: (params: { quest: Quest }) => void;
} => {
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupQuestModify: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
  };
};
