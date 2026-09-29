import { mswServerState } from '../../../state/msw-server/msw-server-state';
import { registerSpyOn } from '../../../register-mock';
import type { SetupServer } from '#gateway/npm/msw__node';
import type { SpyOnHandle } from '../../../register-mock';

export const networkRecordCaptureBrokerProxy = (): {
  getServer: () => SetupServer;
  setupBodyReadFailure: (params: { error: Error }) => void;
  setupStderrCapture: () => SpyOnHandle;
} => ({
  getServer: (): SetupServer => mswServerState.get(),
  setupBodyReadFailure: ({ error }: { error: Error }): void => {
    const handle = registerSpyOn({ object: Request.prototype, method: 'clone' });
    handle.calledWith([]).returns({
      text: async () => Promise.reject(error),
    } as unknown as Request);
  },
  setupStderrCapture: (): SpyOnHandle => {
    const handle = registerSpyOn({ object: process.stderr, method: 'write' });
    handle.calledWith([]).implement(() => true);
    return handle;
  },
});
