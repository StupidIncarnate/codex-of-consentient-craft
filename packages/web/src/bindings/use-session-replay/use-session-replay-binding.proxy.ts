import { rxjsFilterAdapterProxy } from '../../adapters/rxjs/filter/rxjs-filter-adapter.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useSessionReplayBindingProxy = (): {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  getSentWsMessages: () => unknown[];
  triggerWsClose: () => void;
  triggerWsReconnect: () => void;
} => {
  rxjsFilterAdapterProxy();
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
    getSentWsMessages: (): unknown[] => channel.getSentMessages(),
    triggerWsClose: (): void => {
      channel.triggerClose();
    },
    triggerWsReconnect: (): void => {
      channel.triggerReconnect();
    },
  };
};
