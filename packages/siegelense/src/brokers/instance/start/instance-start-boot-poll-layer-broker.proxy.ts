import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { netUnixRequestAdapterProxy } from '../../../adapters/net/unix-request/net-unix-request-adapter.proxy';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';

export const instanceStartBootPollLayerBrokerProxy = (): {
  setupAnswersOk: (params: { socketPath: AbsoluteFilePath }) => void;
  setupNeverAnswers: (params: {
    socketPath: AbsoluteFilePath;
    nowMs: number;
    deadlineMs: number;
  }) => void;
} => {
  const socketProxy = netUnixRequestAdapterProxy();
  const dateHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupAnswersOk: ({ socketPath }: { socketPath: AbsoluteFilePath }): void => {
      socketProxy.respondsWith({ socketPath, response: DriverResponseStub({ ok: true }) });
    },

    // Fails the connect once, then stages `Date.now()` already past the deadline so the poll
    // returns false on its first retry check instead of sleeping through a real ceiling.
    setupNeverAnswers: ({
      socketPath,
      nowMs,
      deadlineMs,
    }: {
      socketPath: AbsoluteFilePath;
      nowMs: number;
      deadlineMs: number;
    }): void => {
      socketProxy.connectFails({
        socketPath,
        error: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      });
      dateHandle.onceFor([]).returns(deadlineMs >= nowMs ? deadlineMs : nowMs);
    },
  };
};
