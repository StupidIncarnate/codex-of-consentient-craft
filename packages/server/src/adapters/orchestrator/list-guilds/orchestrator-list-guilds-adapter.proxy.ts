import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

// listGuilds takes no arguments — `[]` is the exhaustive, honest address. The constructor
// default answers callers that never set up their own scenario, same as the old blanket default.
export const orchestratorListGuildsAdapterProxy = (): {
  returns: (params: { guilds: GuildListItem[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.listGuilds });

  mock.calledWith([]).resolves([]);

  return {
    returns: ({ guilds }: { guilds: GuildListItem[] }): void => {
      mock.calledWith([]).resolves(guilds);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.calledWith([]).rejects(error);
    },
  };
};
