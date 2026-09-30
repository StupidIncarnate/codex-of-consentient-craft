import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { GuildUpdateResponder } from './guild-update-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildUpdateResponderProxy = (): {
  setupUpdateGuild: (params: { guild: Guild }) => void;
  setupUpdateGuildError: (params: { guildId: Guild['id']; message: string }) => void;
  getUpdateGuildCalls: () => RecordedCalls;
  callResponder: typeof GuildUpdateResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupUpdateGuild: ({ guild }: { guild: Guild }): void => {
      orchestrator.updateGuildReturns({ guildId: guild.id, guild });
    },
    setupUpdateGuildError: ({
      guildId,
      message,
    }: {
      guildId: Guild['id'];
      message: string;
    }): void => {
      orchestrator.updateGuildThrows({ guildId, error: new Error(message) });
    },
    getUpdateGuildCalls: (): RecordedCalls => orchestrator.updateGuildGetCalls(),
    callResponder: GuildUpdateResponder,
  };
};
