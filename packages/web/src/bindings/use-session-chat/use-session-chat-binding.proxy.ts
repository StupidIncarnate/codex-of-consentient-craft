import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { sessionChatBrokerProxy } from '../../brokers/session/chat/session-chat-broker.proxy';
import { sessionChatStopBrokerProxy } from '../../brokers/session/chat-stop/session-chat-stop-broker.proxy';
import { sessionClarifyBrokerProxy } from '../../brokers/session/clarify/session-clarify-broker.proxy';

export const useSessionChatBindingProxy = ({ deferOpen = false }: { deferOpen?: boolean } = {}): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupSessionChat: (params: { chatProcessId: ProcessId }) => void;
  setupSessionNew: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  setupStop: () => void;
  setupStopError: () => void;
  receiveWsMessage: (params: { data: string }) => void;
  getSentWsMessages: () => unknown[];
  triggerWsOpen: () => void;
} => {
  const chatProxy = sessionChatBrokerProxy();
  sessionClarifyBrokerProxy();
  const stopProxy = sessionChatStopBrokerProxy();
  const wsProxy = websocketConnectAdapterProxy({ deferOpen });

  return {
    setupChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupSessionChat({ chatProcessId });
      chatProxy.setupSessionNew({ chatProcessId });
    },
    setupSessionChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupSessionChat({ chatProcessId });
    },
    setupSessionNew: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupSessionNew({ chatProcessId });
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
    getSentWsMessages: (): unknown[] => wsProxy.getSentMessages(),
    triggerWsOpen: (): void => {
      wsProxy.triggerOpen();
    },
  };
};
