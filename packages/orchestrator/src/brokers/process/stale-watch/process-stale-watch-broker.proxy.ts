import type { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';
import { timerIntervalStartBrokerProxy } from '../../timer/interval-start/timer-interval-start-broker.proxy';
import { processIsAliveBrokerProxy } from '../is-alive/process-is-alive-broker.proxy';

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
  const timerProxy = timerIntervalStartBrokerProxy({ intervalMs });
  const aliveProxy = processIsAliveBrokerProxy();

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
