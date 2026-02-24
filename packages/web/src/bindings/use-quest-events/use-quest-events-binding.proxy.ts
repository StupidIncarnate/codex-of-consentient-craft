import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';

export const useQuestEventsBindingProxy = (): {
  receiveWsMessage: (params: { data: string }) => void;
  getSocketCloseMock: () => jest.Mock;
} => {
  const wsProxy = websocketConnectAdapterProxy();

  return {
    receiveWsMessage: ({ data }: { data: string }): void => {
      wsProxy.receiveMessage({ data });
    },
    getSocketCloseMock: (): jest.Mock => wsProxy.getSocket().close,
  };
};
