import type { GuildId } from '@dungeonmaster/shared/contracts';
import { orchestratorRemoveGuildAdapterProxy } from '../../../adapters/orchestrator/remove-guild/orchestrator-remove-guild-adapter.proxy';
import { GuildRemoveResponder } from './guild-remove-responder';

export const GuildRemoveResponderProxy = (): {
  setupRemoveGuildError: (params: { guildId: GuildId; message: string }) => void;
  callResponder: typeof GuildRemoveResponder;
} => {
  const adapterProxy = orchestratorRemoveGuildAdapterProxy();

  return {
    setupRemoveGuildError: ({ guildId, message }: { guildId: GuildId; message: string }): void => {
      adapterProxy.throws({ guildId, error: new Error(message) });
    },
    callResponder: GuildRemoveResponder,
  };
};
