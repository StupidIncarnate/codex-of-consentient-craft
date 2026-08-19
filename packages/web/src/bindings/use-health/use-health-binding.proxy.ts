import { healthGetBrokerProxy } from '../../brokers/health/get/health-get-broker.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useHealthBindingProxy = (): ReturnType<typeof healthGetBrokerProxy> & {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  closeChannel: () => void;
} => {
  const broker = healthGetBrokerProxy();
  const channel = webSocketChannelStateProxy();

  return {
    ...broker,
    setupConnectedChannel: (): void => {
      channel.setupEmpty();
      channel.connect();
      channel.triggerOpen();
    },
    deliverWsMessage: ({ data }: { data: string }): void => {
      channel.deliverMessage({ data });
    },
    closeChannel: (): void => {
      channel.triggerClose();
    },
  };
};
