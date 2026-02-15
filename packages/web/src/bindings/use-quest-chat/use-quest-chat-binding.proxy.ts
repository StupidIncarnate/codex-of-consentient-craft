import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { guildChatHistoryBrokerProxy } from '../../brokers/guild/chat-history/guild-chat-history-broker.proxy';
import { questChatBrokerProxy } from '../../brokers/quest/chat/quest-chat-broker.proxy';
import { questChatHistoryBrokerProxy } from '../../brokers/quest/chat-history/quest-chat-history-broker.proxy';
import { questChatStopBrokerProxy } from '../../brokers/quest/chat-stop/quest-chat-stop-broker.proxy';

export const useQuestChatBindingProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  setupStop: () => void;
  setupStopError: () => void;
  receiveWsMessage: (params: { data: string }) => void;
  setupQuestHistory: (params: { entries: unknown[] }) => void;
  setupGuildHistory: (params: { entries: unknown[] }) => void;
  setupQuestHistoryError: () => void;
  setupGuildHistoryError: () => void;
} => {
  const chatProxy = questChatBrokerProxy();
  const stopProxy = questChatStopBrokerProxy();
  const wsProxy = websocketConnectAdapterProxy();
  const questHistoryProxy = questChatHistoryBrokerProxy();
  const guildHistoryProxy = guildChatHistoryBrokerProxy();

  return {
    setupChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupChat({ chatProcessId });
    },
    setupChatError: (): void => {
      chatProxy.setupError();
    },
    setupStop: (): void => {
      stopProxy.setupStop();
    },
    setupStopError: (): void => {
      stopProxy.setupError();
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
