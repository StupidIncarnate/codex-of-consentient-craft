import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';

export const useWardDetailBindingProxy = (): {
  receiveWsMessage: (params: { data: string }) => void;
  getSentMessages: () => unknown[];
} => {
  const wsProxy = websocketConnectAdapterProxy();

  return {
    receiveWsMessage: ({ data }: { data: string }): void => {
      wsProxy.receiveMessage({ data });
    },
    getSentMessages: (): unknown[] => wsProxy.getSentMessages(),
  };
};
