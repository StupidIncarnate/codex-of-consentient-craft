import { orchestratorAddGuildAdapterProxy } from '../../../adapters/orchestrator/add-guild/orchestrator-add-guild-adapter.proxy';
import type { GuildName, GuildPath, GuildStub } from '@dungeonmaster/shared/contracts';
import { GuildAddResponder } from './guild-add-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildAddResponderProxy = (): {
  setupAddGuild: (params: { name: GuildName; path: GuildPath; guild: Guild }) => void;
  setupAddGuildError: (params: { name: GuildName; path: GuildPath; message: string }) => void;
  callResponder: typeof GuildAddResponder;
} => {
  const adapterProxy = orchestratorAddGuildAdapterProxy();

  return {
    setupAddGuild: ({
      name,
      path,
      guild,
    }: {
      name: GuildName;
      path: GuildPath;
      guild: Guild;
    }): void => {
      adapterProxy.returns({ name, path, guild });
    },
    setupAddGuildError: ({
      name,
      path,
      message,
    }: {
      name: GuildName;
      path: GuildPath;
      message: string;
    }): void => {
      adapterProxy.throws({ name, path, error: new Error(message) });
    },
    callResponder: GuildAddResponder,
  };
};
