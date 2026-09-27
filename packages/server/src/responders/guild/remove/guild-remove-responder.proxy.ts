import type { GuildId } from '@dungeonmaster/shared/contracts';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
import { GuildRemoveResponder } from './guild-remove-responder';

export const GuildRemoveResponderProxy = (): {
  setupRemoveGuildError: (params: { guildId: GuildId; message: string }) => void;
  callResponder: typeof GuildRemoveResponder;
} => {
  const orchestrator = StartOrchestratorProxy();

  return {
    setupRemoveGuildError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      orchestrator.removeGuildThrows({ guildId, error: new Error(message) });
    },
    callResponder: GuildRemoveResponder,
  };
};
