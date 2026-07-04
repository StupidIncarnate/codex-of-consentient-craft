import { orchestrationDispatchGetBrokerProxy } from '../../brokers/orchestration/dispatch-get/orchestration-dispatch-get-broker.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useDispatchStateBindingProxy = (): ReturnType<
  typeof orchestrationDispatchGetBrokerProxy
> & {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
} => {
  const broker = orchestrationDispatchGetBrokerProxy();
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
