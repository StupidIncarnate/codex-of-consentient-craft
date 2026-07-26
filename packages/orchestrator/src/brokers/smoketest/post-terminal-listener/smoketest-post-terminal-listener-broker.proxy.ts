import { createTerminalHandlerLayerBrokerProxy } from './create-terminal-handler-layer-broker.proxy';

export const smoketestPostTerminalListenerBrokerProxy = (): {
  reset: () => void;
  setupProcessSucceeds: () => void;
} => {
  const handlerProxy = createTerminalHandlerLayerBrokerProxy();

  return {
    reset: (): void => {
      // No external dependencies to mock beyond the injected subscribe/unsubscribe callbacks.
    },
    // The old registerModuleMock default (a constructor-level `mockResolvedValue`) made every
    // undescribed processTerminalEventLayerBroker call resolve quietly. The argument-addressed
    // API deliberately has no such default — a test that invokes the installed handler and
    // does not care about the dispatched call's outcome must say so explicitly.
    setupProcessSucceeds: (): void => {
      handlerProxy.setupProcessSucceeds();
    },
  };
};
