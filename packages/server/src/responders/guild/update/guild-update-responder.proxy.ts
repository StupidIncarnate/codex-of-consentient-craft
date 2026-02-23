import { orchestratorUpdateGuildAdapterProxy } from '../../../adapters/orchestrator/update-guild/orchestrator-update-guild-adapter.proxy';
import type { GuildStub } from '@dungeonmaster/shared/contracts';
import { GuildUpdateResponder } from './guild-update-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildUpdateResponderProxy = (): {
  setupUpdateGuild: (params: { guild: Guild }) => void;
  setupUpdateGuildError: (params: { message: string }) => void;
  callResponder: typeof GuildUpdateResponder;
} => {
  const adapterProxy = orchestratorUpdateGuildAdapterProxy();

  return {
    setupUpdateGuild: ({ guild }: { guild: Guild }): void => {
      adapterProxy.returns({ guild });
    },
    setupUpdateGuildError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: GuildUpdateResponder,
  };
};
