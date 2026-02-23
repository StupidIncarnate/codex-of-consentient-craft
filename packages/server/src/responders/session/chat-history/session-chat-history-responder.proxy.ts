import { orchestratorGetGuildAdapterProxy } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import { osUserHomedirAdapterProxy } from '../../../adapters/os/user-homedir/os-user-homedir-adapter.proxy';
import { sessionChatHistoryBrokerProxy } from '../../../brokers/session/chat-history/session-chat-history-broker.proxy';
import { SessionChatHistoryResponder } from './session-chat-history-responder';
import type { GuildStub } from '@dungeonmaster/shared/contracts';

type Guild = ReturnType<typeof GuildStub>;

export const SessionChatHistoryResponderProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupHomeDir: (params: { path: string }) => void;
  setupMainEntries: (params: { content: string }) => void;
  setupSubagentDirMissing: () => void;
  setupGuildError: (params: { message: string }) => void;
  callResponder: typeof SessionChatHistoryResponder;
} => {
  const guildProxy = orchestratorGetGuildAdapterProxy();
  const homedirProxy = osUserHomedirAdapterProxy();
  const historyProxy = sessionChatHistoryBrokerProxy();

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      guildProxy.returns({ guild });
    },
    setupHomeDir: ({ path }: { path: string }): void => {
      homedirProxy.returns({ path });
    },
    setupMainEntries: ({ content }: { content: string }): void => {
      historyProxy.setupMainEntries({ content });
    },
    setupSubagentDirMissing: (): void => {
      historyProxy.setupSubagentDirMissing();
    },
    setupGuildError: ({ message }: { message: string }): void => {
      guildProxy.throws({ error: new Error(message) });
    },
    callResponder: SessionChatHistoryResponder,
  };
};
