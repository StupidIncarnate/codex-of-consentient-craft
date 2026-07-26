import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

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
  // useDispatchStateBinding logs directly from its inner catch (no setError state), so any test
  // composing this binding without staging a dispatch-state response would otherwise throw here.
  // passthrough: true — console.error is a shared sink; React's own internal warnings (e.g. act()
  // warnings) also flow through it and must keep printing normally, not throw for being unstaged.
  registerSpyOn({ object: globalThis.console, method: 'error', passthrough: true })
    .calledWith(['[use-dispatch-state]'])
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
