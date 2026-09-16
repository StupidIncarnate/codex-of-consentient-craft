import { questListBroker } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const questQueryRouteBrokerProxy = (): {
  succeeds: ({ guildId, quests }: { guildId: string; quests: readonly Quest[] }) => void;
} => {
  const handle = registerMock({ fn: questListBroker });

  return {
    succeeds: ({ guildId, quests }: { guildId: string; quests: readonly Quest[] }): void => {
      handle.calledWith([{ guildId }]).resolves(quests);
    },
  };
};
