import { mswServerAdapterProxy } from '../../../adapters/msw/server/msw-server-adapter.proxy';
import { registerSpyOn } from '../../../register-mock';
import type { SpyOnHandle } from '../../../register-mock';

export const networkRecordCaptureBrokerProxy = (): {
  setupBodyReadFailure: (params: { error: Error }) => void;
  setupStderrCapture: () => SpyOnHandle;
} => {
  mswServerAdapterProxy();

  return {
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
  };
};
