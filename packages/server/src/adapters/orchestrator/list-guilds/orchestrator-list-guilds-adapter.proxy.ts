import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const orchestratorListGuildsAdapterProxy = (): {
  returns: (params: { guilds: GuildListItem[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.listGuilds });

  mock.mockResolvedValue([]);

  return {
    returns: ({ guilds }: { guilds: GuildListItem[] }): void => {
      mock.mockResolvedValueOnce(guilds);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
