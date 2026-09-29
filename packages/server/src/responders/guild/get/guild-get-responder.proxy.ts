import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { GuildId } from '@dungeonmaster/shared/contracts';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { GuildGetResponder } from './guild-get-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildGetResponderProxy = (): {
  setupGetGuild: (params: { guild: Guild }) => void;
  setupGetGuildError: (params: { guildId: GuildId; message: string }) => void;
  callResponder: typeof GuildGetResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupGetGuild: ({ guild }: { guild: Guild }): void => {
      orchestrator.getGuildReturns({ guild });
    },
    setupGetGuildError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      orchestrator.getGuildThrows({ guildId, error: new Error(message) });
    },
    callResponder: GuildGetResponder,
  };
};
