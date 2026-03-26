import { mswServerAdapterProxy } from '../../../adapters/msw/server/msw-server-adapter.proxy';

export const networkRecordCaptureBrokerProxy = (): {
  setupBodyReadFailure: (params: { error: Error }) => void;
  setupStderrCapture: () => jest.SpyInstance;
} => {
  mswServerAdapterProxy();

  return {
    setupBodyReadFailure: ({ error }: { error: Error }): void => {
      jest.spyOn(Request.prototype, 'clone').mockReturnValue({
        text: async () => Promise.reject(error),
      } as unknown as Request);
    },
    setupStderrCapture: (): jest.SpyInstance =>
      jest.spyOn(process.stderr, 'write').mockImplementation(() => true),
  };
};
