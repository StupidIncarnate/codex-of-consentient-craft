import { createTerminalHandlerLayerBrokerProxy } from './create-terminal-handler-layer-broker.proxy';

export const smoketestPostTerminalListenerBrokerProxy = (): {
  reset: () => void;
} => {
  createTerminalHandlerLayerBrokerProxy();

  return {
    reset: (): void => {
      // No external dependencies to mock beyond the injected subscribe/unsubscribe callbacks.
    },
  };
};
