import { mswServerState } from '../../../state/msw-server/msw-server-state';
import { registerSpyOn } from '../../../register-mock';
import { Request } from '#gateway/node/Request';
import { RequestStub } from '#gateway/node/Request/request.stub';
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
      // A real Request whose own `text()` is the spied method, so the broker reads a genuine value.
      const failing = RequestStub({ method: 'POST', body: '{}' });
      registerSpyOn({ object: failing, method: 'text' }).calledWith([]).rejects(error);
      handle.calledWith([]).returns(failing);
    },
    setupStderrCapture: (): ReturnType<typeof stderrProxy> => stderrCapture,
  };
};
