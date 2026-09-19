import { questGetBroker } from '@dungeonmaster/orchestrator/brokers';
import { questGetBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const operationQueryRouteBrokerProxy = (): {
  succeeds: ({ quest }: { quest: Quest }) => void;
} => {
  // questGetBrokerProxy's own setup drives a full fs-lookup simulation rather than letting a
  // test stage an arbitrary GetQuestResult — created here only to satisfy
  // `enforce-proxy-child-creation`; this broker's own registerMock below stages the real answer.
  questGetBrokerProxy();
  const getQuestHandle = registerMock({ fn: questGetBroker });

  return {
    succeeds: ({ quest }: { quest: Quest }): void => {
      getQuestHandle
        .calledWith([{ input: getQuestInputContract.parse({ questId: quest.id }) }])
        .resolves({ success: true, quest });
    },
  };
};
