import { questGetBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/get/quest-get-broker.proxy';

import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type Quest = ReturnType<typeof QuestStub>;

export const operationQueryRouteBrokerProxy = (): {
  succeeds: ({ quest }: { quest: Quest }) => void;
} => {
  const getProxy = questGetBrokerProxy();

  return {
    succeeds: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },
  };
};
