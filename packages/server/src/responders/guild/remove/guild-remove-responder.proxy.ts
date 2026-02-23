import { orchestratorRemoveGuildAdapterProxy } from '../../../adapters/orchestrator/remove-guild/orchestrator-remove-guild-adapter.proxy';
import { GuildRemoveResponder } from './guild-remove-responder';

export const GuildRemoveResponderProxy = (): {
  setupRemoveGuildError: (params: { message: string }) => void;
  callResponder: typeof GuildRemoveResponder;
} => {
  const adapterProxy = orchestratorRemoveGuildAdapterProxy();

  return {
    setupRemoveGuildError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: GuildRemoveResponder,
  };
};
