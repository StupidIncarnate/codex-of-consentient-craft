import { questGetBrokerProxy } from '@dungeonmaster/orchestrator/testing';

import type { QuestStub } from '@dungeonmaster/shared/contracts';

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
