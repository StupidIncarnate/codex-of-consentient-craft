import { pidProxy } from '#gateway/node/process/pid/pid.proxy';

import { driverSocketRequestBrokerProxy } from '../socket-request/driver-socket-request-broker.proxy';
import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

export const driverLiveCheckBrokerProxy = (): {
  setupPidAlive: (params: { pgid: ProcessGroupId }) => void;
  setupPidDead: (params: { pgid: ProcessGroupId }) => void;
  setupSocketAnswers: (params: { socketPath: string }) => void;
  setupSocketUnreachable: (params: { socketPath: string }) => void;
} => {
  pidProxy();
  const isAliveProxy = processIsAliveBrokerProxy();
  const socketProxy = driverSocketRequestBrokerProxy();

  return {
    setupPidAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      isAliveProxy.setupAlive({ pgid });
    },

    setupPidDead: ({ pgid }: { pgid: ProcessGroupId }): void => {
      isAliveProxy.setupGone({ pgid });
    },

    setupSocketAnswers: ({ socketPath }: { socketPath: string }): void => {
      socketProxy.respondsWith({ socketPath, response: DriverResponseStub({ ok: true }) });
    },

    setupSocketUnreachable: ({ socketPath }: { socketPath: string }): void => {
      socketProxy.connectFailsNoSocket({ socketPath });
    },
  };
};
