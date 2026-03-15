import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runChatLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
} => {
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },
  };
};
