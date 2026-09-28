import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { createTerminalHandlerLayerBrokerProxy } from './create-terminal-handler-layer-broker.proxy';

export const smoketestPostTerminalListenerBrokerProxy = (): {
  reset: () => void;
  setupProcessSucceeds: () => void;
  // Forwarded from the dispatched handler's own mocked boundary — a caller composing THIS proxy
  // needs this to prove the real install wiring reaches processTerminalEventLayerBroker with the
  // right shape, without reaching past this proxy into its child.
  getProcessCallArgs: () => RecordedCalls;
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
    getProcessCallArgs: (): RecordedCalls => handlerProxy.getProcessCallArgs(),
  };
};
