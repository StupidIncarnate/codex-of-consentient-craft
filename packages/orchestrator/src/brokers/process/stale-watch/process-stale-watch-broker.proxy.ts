import { procCheckAliveAdapterProxy } from '../../../adapters/proc/check-alive/proc-check-alive-adapter.proxy';
import { timerSetIntervalAdapterProxy } from '../../../adapters/timer/set-interval/timer-set-interval-adapter.proxy';
import type { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';

type ProcessPid = ReturnType<typeof ProcessPidStub>;

export const processStaleWatchBrokerProxy = ({
  intervalMs,
}: {
  intervalMs: number;
}): {
  triggerTick: () => void;
  setupAlive: (params: { pid: ProcessPid }) => void;
  setupDead: (params: { pid: ProcessPid }) => void;
} => {
  const timerProxy = timerSetIntervalAdapterProxy({ intervalMs });
  const aliveProxy = procCheckAliveAdapterProxy();

  return {
    triggerTick: (): void => {
      timerProxy.triggerTick();
    },
    setupAlive: ({ pid }: { pid: ProcessPid }): void => {
      aliveProxy.setupAlive({ pid });
    },
    setupDead: ({ pid }: { pid: ProcessPid }): void => {
      aliveProxy.setupDead({ pid });
    },
  };
};
