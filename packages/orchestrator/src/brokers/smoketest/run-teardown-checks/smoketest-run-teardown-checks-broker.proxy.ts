import { isPortFree } from '#gateway/node/net';
import { isPortFreeProxy } from '#gateway/node/net/is-port-free/is-port-free.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';
import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';

type ProcessPid = ReturnType<typeof ProcessPidStub>;

export const smoketestRunTeardownChecksBrokerProxy = (): {
  setupPortFree: (params: { port: number }) => void;
  setupPortInUse: (params: { port: number }) => void;
  setupProcessAlive: (params: { pid: ProcessPid }) => void;
  setupProcessGone: (params: { pid: ProcessPid }) => void;
} => {
  // `isPortFreeProxy` stages nothing: the wrapper binds a real socket. A test names an arbitrary
  // port, so the wrapper itself is staged by the port each check carries.
  isPortFreeProxy();
  const portHandle = registerMock({ fn: isPortFree });
  const processProxy = processIsAliveBrokerProxy();

  return {
    setupPortFree: ({ port }: { port: number }): void => {
      portHandle.calledWith([{ port }]).resolves(true);
    },
    setupPortInUse: ({ port }: { port: number }): void => {
      portHandle.calledWith([{ port }]).resolves(false);
    },
    setupProcessAlive: ({ pid }: { pid: ProcessPid }): void => {
      processProxy.setupAlive({ pid });
    },
    setupProcessGone: ({ pid }: { pid: ProcessPid }): void => {
      processProxy.setupDead({ pid });
    },
  };
};
