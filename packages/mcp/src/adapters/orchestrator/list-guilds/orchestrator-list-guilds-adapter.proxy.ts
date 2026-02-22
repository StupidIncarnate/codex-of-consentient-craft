/**
 * PURPOSE: Proxy for orchestrator-list-guilds-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorListGuildsAdapterProxy();
 * proxy.returns({ guilds: [GuildListItemStub()] });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';

jest.mock('@dungeonmaster/orchestrator');

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const orchestratorListGuildsAdapterProxy = (): {
  returns: (params: { guilds: GuildListItem[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(StartOrchestrator.listGuilds);

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
