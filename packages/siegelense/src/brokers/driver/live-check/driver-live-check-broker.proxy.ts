import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { netUnixRequestAdapterProxy } from '../../../adapters/net/unix-request/net-unix-request-adapter.proxy';
import { processIsAliveAdapterProxy } from '../../../adapters/process/is-alive/process-is-alive-adapter.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';
import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

export const driverLiveCheckBrokerProxy = (): {
  setupPidAlive: (params: { pgid: ProcessGroupId }) => void;
  setupPidDead: (params: { pgid: ProcessGroupId }) => void;
  setupSocketAnswers: (params: { socketPath: AbsoluteFilePath }) => void;
  setupSocketUnreachable: (params: { socketPath: AbsoluteFilePath }) => void;
} => {
  const isAliveProxy = processIsAliveAdapterProxy();
  const socketProxy = netUnixRequestAdapterProxy();

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
      socketProxy.connectFails({
        socketPath,
        error: Object.assign(new Error('connect ENOENT'), { code: 'ENOENT' }),
      });
    },
  };
};
