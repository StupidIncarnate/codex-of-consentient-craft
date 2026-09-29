import { isPortFreeProxy } from '#gateway/node/net/is-port-free/is-port-free.proxy';

import type { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';
import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';

type ProcessPid = ReturnType<typeof ProcessPidStub>;

export const smoketestRunTeardownChecksBrokerProxy = (): {
  setupPortFree: (params: { port: number }) => void;
  setupPortInUse: (params: { port: number }) => void;
  setupProcessAlive: (params: { pid: ProcessPid }) => void;
  setupProcessGone: (params: { pid: ProcessPid }) => void;
} => {
  const portProxy = isPortFreeProxy();
  const processProxy = processIsAliveBrokerProxy();

  return {
    setupPortFree: ({ port }: { port: number }): void => {
      portProxy.setupPortFree({ port });
    },
    setupPortInUse: ({ port }: { port: number }): void => {
      portProxy.setupPortInUse({ port });
    },
    setupProcessAlive: ({ pid }: { pid: ProcessPid }): void => {
      processProxy.setupAlive({ pid });
    },
    setupProcessGone: ({ pid }: { pid: ProcessPid }): void => {
      processProxy.setupDead({ pid });
    },
  };
};
