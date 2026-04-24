import { createSyncHandlerLayerBrokerProxy } from './create-sync-handler-layer-broker.proxy';

export const questQueueSyncListenerBrokerProxy = (): {
  reset: () => void;
} => {
  createSyncHandlerLayerBrokerProxy();

  return {
    reset: (): void => {
      // No external dependencies to mock beyond the injected subscribe/unsubscribe callbacks.
    },
  };
};
