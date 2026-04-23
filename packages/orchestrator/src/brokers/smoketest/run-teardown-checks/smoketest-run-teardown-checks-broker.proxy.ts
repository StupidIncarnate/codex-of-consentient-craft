import { netCheckPortFreeAdapterProxy } from '../../../adapters/net/check-port-free/net-check-port-free-adapter.proxy';
import { processSignalAdapterProxy } from '../../../adapters/process/signal/process-signal-adapter.proxy';

export const smoketestRunTeardownChecksBrokerProxy = (): {
  setupPortFree: () => void;
  setupPortInUse: () => void;
} => {
  const portProxy = netCheckPortFreeAdapterProxy();
  processSignalAdapterProxy();

  return {
    setupPortFree: (): void => {
      portProxy.setupPortFree();
    },
    setupPortInUse: (): void => {
      portProxy.setupPortInUse();
    },
  };
};
