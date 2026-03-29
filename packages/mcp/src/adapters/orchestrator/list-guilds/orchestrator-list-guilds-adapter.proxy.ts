/**
 * PURPOSE: Proxy for orchestrator-list-guilds-adapter that mocks the orchestrator package
 *
 * USAGE:
 * const proxy = orchestratorListGuildsAdapterProxy();
 * proxy.returns({ guilds: [GuildListItemStub()] });
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type GuildListItem = ReturnType<typeof GuildListItemStub>;

export const orchestratorListGuildsAdapterProxy = (): {
  returns: (params: { guilds: GuildListItem[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: StartOrchestrator.listGuilds });

  handle.mockResolvedValue([]);

  return {
    returns: ({ guilds }: { guilds: GuildListItem[] }): void => {
      handle.mockResolvedValueOnce(guilds);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
