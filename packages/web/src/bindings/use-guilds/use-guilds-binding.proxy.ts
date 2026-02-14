import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { guildListBrokerProxy } from '../../brokers/guild/list/guild-list-broker.proxy';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const useGuildsBindingProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupError: () => void;
} => {
  const brokerProxy = guildListBrokerProxy();

  return {
    setupGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      brokerProxy.setupGuilds({ guilds });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
  };
};
