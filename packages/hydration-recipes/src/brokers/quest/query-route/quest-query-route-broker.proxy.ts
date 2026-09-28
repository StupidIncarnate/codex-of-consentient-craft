import { questListBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import type { QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const questQueryRouteBrokerProxy = (): {
  succeeds: ({ guildId, quests }: { guildId: string; quests: readonly Quest[] }) => void;
} => {
  const listProxy = questListBrokerProxy();

  return {
    succeeds: ({ guildId, quests }: { guildId: string; quests: readonly Quest[] }): void => {
      listProxy.setupDirectList({ guildId: GuildIdStub({ value: guildId }), quests });
    },
  };
};
