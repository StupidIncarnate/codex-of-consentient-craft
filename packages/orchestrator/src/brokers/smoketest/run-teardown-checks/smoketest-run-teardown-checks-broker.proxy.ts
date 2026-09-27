import { netCheckPortFreeAdapterProxy } from '../../../adapters/net/check-port-free/net-check-port-free-adapter.proxy';
import { processSignalAdapterProxy } from '../../../adapters/process/signal/process-signal-adapter.proxy';
import type { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';

type ProcessPid = ReturnType<typeof ProcessPidStub>;

export const smoketestRunTeardownChecksBrokerProxy = (): {
  setupPortFree: () => void;
  setupPortInUse: () => void;
  setupProcessAlive: (params: { pid: ProcessPid }) => void;
  setupProcessGone: (params: { pid: ProcessPid }) => void;
} => {
  const portProxy = netCheckPortFreeAdapterProxy();
  const processProxy = processSignalAdapterProxy();

  return {
    setupPortFree: (): void => {
      portProxy.setupPortFree();
    },
    setupPortInUse: (): void => {
      portProxy.setupPortInUse();
    },
    setupProcessAlive: ({ pid }: { pid: ProcessPid }): void => {
      processProxy.setupAlive({ pid });
    },
    setupProcessGone: ({ pid }: { pid: ProcessPid }): void => {
      processProxy.setupDead({ pid });
    },
  };
};
