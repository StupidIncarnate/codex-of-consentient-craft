import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { guildChatBrokerProxy } from '../../brokers/guild/chat/guild-chat-broker.proxy';
import { guildChatHistoryBrokerProxy } from '../../brokers/guild/chat-history/guild-chat-history-broker.proxy';
import { guildChatStopBrokerProxy } from '../../brokers/guild/chat-stop/guild-chat-stop-broker.proxy';
import { questChatBrokerProxy } from '../../brokers/quest/chat/quest-chat-broker.proxy';
import { questChatHistoryBrokerProxy } from '../../brokers/quest/chat-history/quest-chat-history-broker.proxy';
import { questChatStopBrokerProxy } from '../../brokers/quest/chat-stop/quest-chat-stop-broker.proxy';

export const useQuestChatBindingProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupGuildChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  setupGuildChatError: () => void;
  setupStop: () => void;
  setupGuildStop: () => void;
  setupStopError: () => void;
  setupGuildStopError: () => void;
  receiveWsMessage: (params: { data: string }) => void;
  setupQuestHistory: (params: { entries: unknown[] }) => void;
  setupGuildHistory: (params: { entries: unknown[] }) => void;
  setupQuestHistoryError: () => void;
  setupGuildHistoryError: () => void;
} => {
  const chatProxy = questChatBrokerProxy();
  const guildChatProxy = guildChatBrokerProxy();
  const stopProxy = questChatStopBrokerProxy();
  const guildStopProxy = guildChatStopBrokerProxy();
  const wsProxy = websocketConnectAdapterProxy();
  const questHistoryProxy = questChatHistoryBrokerProxy();
  const guildHistoryProxy = guildChatHistoryBrokerProxy();

  return {
    setupChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupChat({ chatProcessId });
    },
    setupGuildChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      guildChatProxy.setupChat({ chatProcessId });
    },
    setupChatError: (): void => {
      chatProxy.setupError();
    },
    setupGuildChatError: (): void => {
      guildChatProxy.setupError();
    },
    setupStop: (): void => {
      stopProxy.setupStop();
    },
    setupGuildStop: (): void => {
      guildStopProxy.setupStop();
    },
    setupStopError: (): void => {
      stopProxy.setupError();
    },
    setupGuildStopError: (): void => {
      guildStopProxy.setupError();
    },
    receiveWsMessage: ({ data }: { data: string }): void => {
      wsProxy.receiveMessage({ data });
    },
    setupQuestHistory: ({ entries }: { entries: unknown[] }): void => {
      questHistoryProxy.setupHistory({ entries });
    },
    setupGuildHistory: ({ entries }: { entries: unknown[] }): void => {
      guildHistoryProxy.setupHistory({ entries });
    },
    setupQuestHistoryError: (): void => {
      questHistoryProxy.setupError();
    },
    setupGuildHistoryError: (): void => {
      guildHistoryProxy.setupError();
    },
  };
};
