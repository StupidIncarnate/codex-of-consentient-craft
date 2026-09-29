import { mswServerState } from '../../../state/msw-server/msw-server-state';
import { registerSpyOn } from '../../../register-mock';
import { Request } from '#gateway/node/Request';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import type { SetupServer } from '#gateway/npm/msw__node';

export const networkRecordCaptureBrokerProxy = (): {
  getServer: () => SetupServer;
  setupBodyReadFailure: (params: { error: Error }) => void;
  setupStderrCapture: () => ReturnType<typeof stderrProxy>;
} => {
  const stderrCapture = stderrProxy();

  return {
    getServer: (): SetupServer => mswServerState.get(),
    setupBodyReadFailure: ({ error }: { error: Error }): void => {
      const handle = registerSpyOn({ object: Request.prototype, method: 'clone' });
      handle.calledWith([]).returns({
        text: async () => Promise.reject(error),
      } as unknown as Request);
    },
    setupStderrCapture: (): ReturnType<typeof stderrProxy> => stderrCapture,
  };
};
