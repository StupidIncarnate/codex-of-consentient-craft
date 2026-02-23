import { orchestratorGetGuildAdapterProxy } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import type { GuildStub } from '@dungeonmaster/shared/contracts';
import { GuildGetResponder } from './guild-get-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildGetResponderProxy = (): {
  setupGetGuild: (params: { guild: Guild }) => void;
  setupGetGuildError: (params: { message: string }) => void;
  callResponder: typeof GuildGetResponder;
} => {
  const adapterProxy = orchestratorGetGuildAdapterProxy();

  return {
    setupGetGuild: ({ guild }: { guild: Guild }): void => {
      adapterProxy.returns({ guild });
    },
    setupGetGuildError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: GuildGetResponder,
  };
};
