import { rateLimitsGetBrokerProxy } from '../../brokers/rate-limits/get/rate-limits-get-broker.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useRateLimitsBindingProxy = (): ReturnType<typeof rateLimitsGetBrokerProxy> & {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
} => {
  const broker = rateLimitsGetBrokerProxy();
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
  };
};
