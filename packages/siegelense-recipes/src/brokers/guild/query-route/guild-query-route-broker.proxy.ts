import { guildListBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildListBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const guildQueryRouteBrokerProxy = (): {
  succeeds: ({ guilds }: { guilds: readonly GuildListItem[] }) => void;
} => {
  // guildListBrokerProxy's own setupDirectListing answers only ONE call — created here only to
  // satisfy `enforce-proxy-child-creation`; this route's own registerMock below answers EVERY
  // call, sticky, which every caller composing this proxy alongside another guildList lookup in
  // the same test relies on.
  guildListBrokerProxy();
  const listGuildsHandle = registerMock({ fn: guildListBroker });

  return {
    succeeds: ({ guilds }: { guilds: readonly GuildListItem[] }): void => {
      listGuildsHandle.calledWith([]).resolves(guilds);
    },
  };
};
