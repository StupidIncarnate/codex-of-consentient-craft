import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { GuildName, GuildPath } from '@dungeonmaster/shared/contracts';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { GuildAddResponder } from './guild-add-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildAddResponderProxy = (): {
  setupAddGuild: (params: { name: GuildName; path: GuildPath; guild: Guild }) => void;
  setupAddGuildError: (params: { name: GuildName; path: GuildPath; message: string }) => void;
  callResponder: typeof GuildAddResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

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
      orchestrator.addGuildReturns({ name, path, guild });
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
      orchestrator.addGuildThrows({ name, path, error: new Error(message) });
    },
    callResponder: GuildAddResponder,
  };
};
