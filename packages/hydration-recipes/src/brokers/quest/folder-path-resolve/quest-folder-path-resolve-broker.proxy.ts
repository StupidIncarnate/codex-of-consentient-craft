import { questOwningGuildFindBrokerProxy } from '../owning-guild-find/quest-owning-guild-find-broker.proxy';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

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
