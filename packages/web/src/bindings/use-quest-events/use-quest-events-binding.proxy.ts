import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';

export const useQuestEventsBindingProxy = (): {
  receiveWsMessage: (params: { data: string }) => void;
  getSocketClose: () => jest.Mock;
  getSentMessages: () => unknown[];
} => {
  const wsProxy = websocketConnectAdapterProxy();

  return {
    receiveWsMessage: ({ data }: { data: string }): void => {
      wsProxy.receiveMessage({ data });
    },
    getSocketClose: (): jest.Mock => wsProxy.getSocket().close,
    getSentMessages: (): unknown[] => wsProxy.getSentMessages(),
  };
};
