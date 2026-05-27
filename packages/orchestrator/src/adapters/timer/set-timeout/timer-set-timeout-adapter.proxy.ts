import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { ElapsedMsStub } from '../../../contracts/elapsed-ms/elapsed-ms.stub';

type ElapsedMs = ReturnType<typeof ElapsedMsStub>;

export const timerSetTimeoutAdapterProxy = (): {
  resolveImmediately: () => void;
  getRegisteredDelay: () => ElapsedMs | undefined;
} => {
  const captured: { delayMs: ElapsedMs | undefined } = { delayMs: undefined };

  const setTimeoutSpy = registerSpyOn({ object: globalThis, method: 'setTimeout' });
  setTimeoutSpy.mockImplementation(((cb: () => void, ms: number) => {
    captured.delayMs = ElapsedMsStub({ value: ms });
    cb();
    return 0 as never;
  }) as never);

  return {
    resolveImmediately: (): void => {
      // No-op — implementation invokes the callback synchronously via the spy above.
    },
    getRegisteredDelay: (): ElapsedMs | undefined => captured.delayMs,
  };
};
