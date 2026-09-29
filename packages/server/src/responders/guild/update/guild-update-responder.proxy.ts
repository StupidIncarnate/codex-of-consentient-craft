import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { GuildId } from '@dungeonmaster/shared/contracts';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { GuildUpdateResponder } from './guild-update-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildUpdateResponderProxy = (): {
  setupUpdateGuild: (params: { guild: Guild }) => void;
  setupUpdateGuildError: (params: { guildId: GuildId; message: string }) => void;
  callResponder: typeof GuildUpdateResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupUpdateGuild: ({ guild }: { guild: Guild }): void => {
      orchestrator.updateGuildReturns({ guildId: guild.id, guild });
    },
    setupUpdateGuildError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      orchestrator.updateGuildThrows({ guildId, error: new Error(message) });
    },
    callResponder: GuildUpdateResponder,
  };
};
