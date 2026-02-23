import { orchestratorAddGuildAdapterProxy } from '../../../adapters/orchestrator/add-guild/orchestrator-add-guild-adapter.proxy';
import type { GuildStub } from '@dungeonmaster/shared/contracts';
import { GuildAddResponder } from './guild-add-responder';

type Guild = ReturnType<typeof GuildStub>;

export const GuildAddResponderProxy = (): {
  setupAddGuild: (params: { guild: Guild }) => void;
  setupAddGuildError: (params: { message: string }) => void;
  callResponder: typeof GuildAddResponder;
} => {
  const adapterProxy = orchestratorAddGuildAdapterProxy();

  return {
    setupAddGuild: ({ guild }: { guild: Guild }): void => {
      adapterProxy.returns({ guild });
    },
    setupAddGuildError: ({ message }: { message: string }): void => {
      adapterProxy.throws({ error: new Error(message) });
    },
    callResponder: GuildAddResponder,
  };
};
