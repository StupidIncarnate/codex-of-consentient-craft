import { rxjsFilterAdapterProxy } from '../../adapters/rxjs/filter/rxjs-filter-adapter.proxy';
import { rxjsTakeAdapterProxy } from '../../adapters/rxjs/take/rxjs-take-adapter.proxy';
import { rxjsTimeoutAdapterProxy } from '../../adapters/rxjs/timeout/rxjs-timeout-adapter.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useWardDetailBindingProxy = (): {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  getSentMessages: () => unknown[];
} => {
  rxjsFilterAdapterProxy();
  rxjsTakeAdapterProxy();
  rxjsTimeoutAdapterProxy();
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
