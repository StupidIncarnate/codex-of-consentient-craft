import { questListBroker } from '@dungeonmaster/orchestrator/brokers';
import { questListBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const questQueryRouteBrokerProxy = (): {
  succeeds: ({ guildId, quests }: { guildId: string; quests: readonly Quest[] }) => void;
} => {
  // questListBrokerProxy's own setupDirectList answers only ONE call per guildId — created here
  // only to satisfy `enforce-proxy-child-creation`; this route's own registerMock below answers
  // EVERY call, sticky.
  questListBrokerProxy();
  const handle = registerMock({ fn: questListBroker });

  return {
    succeeds: ({ guildId, quests }: { guildId: string; quests: readonly Quest[] }): void => {
      handle.calledWith([{ guildId }]).resolves(quests);
    },
  };
};
