import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';

export const useSessionReplayBindingProxy = (): {
  receiveWsMessage: (params: { data: string }) => void;
  getSentWsMessages: () => unknown[];
  triggerWsOpen: () => void;
  triggerWsClose: () => void;
  triggerWsReconnect: () => void;
  getSocketClose: () => jest.Mock;
  getCurrentSocket: () => object;
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
    triggerWsClose: () => {
      wsProxy.triggerClose();
    },
    triggerWsReconnect: () => {
      wsProxy.triggerReconnect();
    },
    getSocketClose: () => wsProxy.getSocket().close,
    getCurrentSocket: () => wsProxy.getSocket() as object,
  };
};
