import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const guildQueryRouteBrokerProxy = (): {
  succeeds: ({ guilds }: { guilds: readonly GuildListItem[] }) => void;
} => {
  const listGuildsHandle = registerMock({ fn: StartOrchestrator.listGuilds });

  return {
    succeeds: ({ guilds }: { guilds: readonly GuildListItem[] }): void => {
      listGuildsHandle.calledWith([]).resolves(guilds);
    },
  };
};
