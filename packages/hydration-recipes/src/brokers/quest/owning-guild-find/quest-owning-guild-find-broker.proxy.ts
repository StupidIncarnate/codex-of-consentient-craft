import { guildListBrokerProxy, questListBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';

import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questOwningGuildFindBrokerProxy = (): {
  succeeds: ({
    guilds,
    questsByGuildId,
  }: {
    guilds: readonly GuildListItem[];
    questsByGuildId: Readonly<Record<string, readonly Quest[]>>;
  }) => void;
} => {
  const guildListProxy = guildListBrokerProxy();
  const questListProxy = questListBrokerProxy();

  return {
    succeeds: ({
      guilds,
      questsByGuildId,
    }: {
      guilds: readonly GuildListItem[];
      questsByGuildId: Readonly<Record<string, readonly Quest[]>>;
    }): void => {
      guildListProxy.setupDirectListing({ items: guilds });
      Object.entries(questsByGuildId).forEach(([guildId, quests]) => {
        questListProxy.setupDirectList({ guildId: GuildIdStub({ value: guildId }), quests });
      });
    },
  };
};
