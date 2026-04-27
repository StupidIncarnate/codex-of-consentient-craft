import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';

export const useSessionReplayBindingProxy = (): {
  receiveWsMessage: (params: { data: string }) => void;
  getSentWsMessages: () => unknown[];
  triggerWsOpen: () => void;
  getSocketClose: () => jest.Mock;
} => {
  const wsProxy = websocketConnectAdapterProxy();

  return {
    receiveWsMessage: ({ data }) => {
      wsProxy.receiveMessage({ data });
    },
    getSentWsMessages: () => wsProxy.getSentMessages(),
    triggerWsOpen: () => {
      wsProxy.triggerOpen();
    },
    getSocketClose: () => wsProxy.getSocket().close,
  };
};
