import { guildListBrokerProxy } from '@dungeonmaster/orchestrator/testing';

import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const guildQueryRouteBrokerProxy = (): {
  succeeds: ({ guilds }: { guilds: readonly GuildListItem[] }) => void;
} => {
  const listProxy = guildListBrokerProxy();

  return {
    succeeds: ({ guilds }: { guilds: readonly GuildListItem[] }): void => {
      listProxy.setupDirectListing({ items: guilds });
    },
  };
};
