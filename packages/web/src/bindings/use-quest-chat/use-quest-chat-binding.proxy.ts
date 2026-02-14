import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { questChatBrokerProxy } from '../../brokers/quest/chat/quest-chat-broker.proxy';

export const useQuestChatBindingProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  receiveWsMessage: (params: { data: string }) => void;
} => {
  const chatProxy = questChatBrokerProxy();
  const wsProxy = websocketConnectAdapterProxy();

  return {
    setupChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatProxy.setupChat({ chatProcessId });
    },
    setupChatError: (): void => {
      chatProxy.setupError();
    },
    receiveWsMessage: ({ data }: { data: string }): void => {
      wsProxy.receiveMessage({ data });
    },
  };
};
