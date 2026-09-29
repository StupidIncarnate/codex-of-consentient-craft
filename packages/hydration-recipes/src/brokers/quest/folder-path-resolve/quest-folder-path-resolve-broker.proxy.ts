import { questOwningGuildFindBrokerProxy } from '../owning-guild-find/quest-owning-guild-find-broker.proxy';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questFolderPathResolveBrokerProxy = (): {
  succeeds: ({ guild, quest }: { guild: GuildListItem; quest: Quest }) => void;
} => {
  const findGuildProxy = questOwningGuildFindBrokerProxy();

  return {
    succeeds: ({ guild, quest }: { guild: GuildListItem; quest: Quest }): void => {
      findGuildProxy.succeeds({ guilds: [guild], questsByGuildId: { [guild.id]: [quest] } });
    },
  };
};
