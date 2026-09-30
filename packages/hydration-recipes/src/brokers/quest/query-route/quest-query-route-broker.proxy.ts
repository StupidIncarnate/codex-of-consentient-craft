import type { Guild } from '@dungeonmaster/shared/contracts';
import { questListBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/list/quest-list-broker.proxy';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';

import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type Quest = ReturnType<typeof QuestStub>;

export const questQueryRouteBrokerProxy = (): {
  succeeds: ({ guildId, quests }: { guildId: Guild['id']; quests: readonly Quest[] }) => void;
} => {
  const listProxy = questListBrokerProxy();

  return {
    succeeds: ({ guildId, quests }: { guildId: Guild['id']; quests: readonly Quest[] }): void => {
      listProxy.setupDirectList({ guildId: GuildIdStub({ value: guildId }), quests });
    },
  };
};
