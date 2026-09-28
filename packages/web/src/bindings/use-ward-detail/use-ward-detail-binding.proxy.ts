import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useWardDetailBindingProxy = (): {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  getSentMessages: () => unknown[];
} => {
  const channel = webSocketChannelStateProxy();

  return {
    setupConnectedChannel: (): void => {
      channel.setupEmpty();
      channel.connect();
      channel.triggerOpen();
    },
    deliverWsMessage: ({ data }: { data: string }): void => {
      channel.deliverMessage({ data });
    },
    getSentMessages: (): unknown[] => channel.getSentMessages(),
  };
};
