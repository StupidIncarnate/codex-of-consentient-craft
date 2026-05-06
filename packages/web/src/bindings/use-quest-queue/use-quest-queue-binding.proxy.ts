import { questQueueBrokerProxy } from '../../brokers/quest/queue/quest-queue-broker.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useQuestQueueBindingProxy = (): ReturnType<typeof questQueueBrokerProxy> & {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
} => {
  const broker = questQueueBrokerProxy();
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
