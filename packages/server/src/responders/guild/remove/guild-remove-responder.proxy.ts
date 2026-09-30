import type { Guild } from '@dungeonmaster/shared/contracts';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { GuildRemoveResponder } from './guild-remove-responder';

export const GuildRemoveResponderProxy = (): {
  setupRemoveGuildSuccess: (params: { guildId: Guild['id'] }) => void;
  setupRemoveGuildError: (params: { guildId: Guild['id']; message: string }) => void;
  callResponder: typeof GuildRemoveResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupRemoveGuildSuccess: ({ guildId }: { guildId: Guild['id'] }): void => {
      orchestrator.removeGuildResolves({ guildId });
    },
    setupRemoveGuildError: ({
      guildId,
      message,
    }: {
      guildId: Guild['id'];
      message: string;
    }): void => {
      orchestrator.removeGuildThrows({ guildId, error: new Error(message) });
    },
    callResponder: GuildRemoveResponder,
  };
};
