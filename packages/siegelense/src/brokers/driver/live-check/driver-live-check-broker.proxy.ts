import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { driverSocketRequestBrokerProxy } from '../socket-request/driver-socket-request-broker.proxy';
import { processIsAliveBrokerProxy } from '../../process/is-alive/process-is-alive-broker.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

export const driverLiveCheckBrokerProxy = (): {
  setupPidAlive: (params: { pgid: ProcessGroupId }) => void;
  setupPidDead: (params: { pgid: ProcessGroupId }) => void;
  setupSocketAnswers: (params: { socketPath: AbsoluteFilePath }) => void;
  setupSocketUnreachable: (params: { socketPath: AbsoluteFilePath }) => void;
} => {
  const isAliveProxy = processIsAliveBrokerProxy();
  const socketProxy = driverSocketRequestBrokerProxy();

  return {
    setupPidAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      isAliveProxy.setupAlive({ pgid });
    },

    setupPidDead: ({ pgid }: { pgid: ProcessGroupId }): void => {
      isAliveProxy.setupGone({ pgid });
    },

    setupSocketAnswers: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      socketProxy.respondsWith({ socketPath, response: DriverResponseStub({ ok: true }) });
    },

    setupSocketUnreachable: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      socketProxy.connectFailsNoSocket({ socketPath });
    },
  };
};
