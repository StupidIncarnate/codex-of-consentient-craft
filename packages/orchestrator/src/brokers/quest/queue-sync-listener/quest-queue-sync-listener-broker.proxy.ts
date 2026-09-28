import { createSyncHandlerLayerBrokerProxy } from './create-sync-handler-layer-broker.proxy';

export const questQueueSyncListenerBrokerProxy = (): {
  reset: () => void;
  // Forwarded from the dispatched handler's own mocked boundary — a caller composing THIS proxy
  // needs these to prove the real install wiring reaches processSyncEventLayerBroker with the
  // right shape, without reaching past this proxy into its child.
  setupProcessSucceeds: () => void;
  getProcessCallArgs: () => readonly unknown[][];
} => {
  const handlerProxy = createSyncHandlerLayerBrokerProxy();

  return {
    reset: (): void => {
      // No external dependencies to mock beyond the injected subscribe/unsubscribe callbacks.
    },
    setupProcessSucceeds: (): void => {
      handlerProxy.setupProcessSucceeds();
    },
    getProcessCallArgs: (): readonly unknown[][] => handlerProxy.getProcessCallArgs(),
  };
};
