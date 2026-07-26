import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { rateLimitsGetBrokerProxy } from '../../brokers/rate-limits/get/rate-limits-get-broker.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

export const useRateLimitsBindingProxy = (): ReturnType<typeof rateLimitsGetBrokerProxy> & {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
} => {
  const broker = rateLimitsGetBrokerProxy();
  const channel = webSocketChannelStateProxy();
  // useRateLimitsBinding logs directly from its inner catch (no setError state), so any test
  // composing this binding without staging a rate-limits response would otherwise throw here.
  // passthrough: true — console.error is a shared sink; React's own internal warnings (e.g. act()
  // warnings) also flow through it and must keep printing normally, not throw for being unstaged.
  registerSpyOn({ object: globalThis.console, method: 'error', passthrough: true })
    .calledWith(['[use-rate-limits]'])
    .returns(undefined);

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
