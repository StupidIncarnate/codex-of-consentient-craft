import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { sessionChatBrokerProxy } from '../../brokers/session/chat/session-chat-broker.proxy';
import { sessionChatHistoryBrokerProxy } from '../../brokers/session/chat-history/session-chat-history-broker.proxy';
import { sessionChatStopBrokerProxy } from '../../brokers/session/chat-stop/session-chat-stop-broker.proxy';

export const useSessionChatBindingProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupSessionChat: (params: { chatProcessId: ProcessId }) => void;
  setupGuildChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  setupStop: () => void;
  setupStopError: () => void;
  receiveWsMessage: (params: { data: string }) => void;
  setupHistory: (params: { entries: unknown[] }) => void;
  setupHistoryError: () => void;
} => {
  const chatProxy = sessionChatBrokerProxy();
  const stopProxy = sessionChatStopBrokerProxy();
  const wsProxy = websocketConnectAdapterProxy();
  const historyProxy = sessionChatHistoryBrokerProxy();

  return {
    setupChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupSessionChat({ chatProcessId });
      chatProxy.setupGuildChat({ chatProcessId });
    },
    setupSessionChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupSessionChat({ chatProcessId });
    },
    setupGuildChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupGuildChat({ chatProcessId });
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
    setupHistory: ({ entries }: { entries: unknown[] }): void => {
      historyProxy.setupHistory({ entries });
    },
    setupHistoryError: (): void => {
      historyProxy.setupError();
    },
  };
};
