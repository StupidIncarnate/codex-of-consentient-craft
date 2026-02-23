import { orchestratorListGuildsAdapterProxy } from '../../../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.proxy';
import { GuildListResponder } from './guild-list-responder';

export const GuildListResponderProxy = (): {
  setupListGuilds: (params: { guilds: unknown[] }) => void;
  setupListGuildsError: (params: { message: string }) => void;
  callResponder: typeof GuildListResponder;
} => {
  const adapterProxy = orchestratorListGuildsAdapterProxy();

  return {
    setupListGuilds: ({ guilds }: { guilds: unknown[] }): void => {
      adapterProxy.returns({ guilds: guilds as never });
    },
    setupListGuildsError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: GuildListResponder,
  };
};
