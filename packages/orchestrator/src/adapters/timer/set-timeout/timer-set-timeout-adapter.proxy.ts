import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { ElapsedMsStub } from '../../../contracts/elapsed-ms/elapsed-ms.stub';

type ElapsedMs = ReturnType<typeof ElapsedMsStub>;

export const timerSetTimeoutAdapterProxy = (): {
  resolveImmediately: () => void;
  getRegisteredDelay: () => ElapsedMs | undefined;
} => {
  const captured: { delayMs: ElapsedMs | undefined } = { delayMs: undefined };

  const setTimeoutSpy = registerSpyOn({
    object: globalThis,
    method: 'setTimeout',
    passthrough: true,
  });
  // The requested delay varies per caller (a long-poll's default interval, or a test-supplied
  // longPollIntervalMs) and this adapter's whole contract is "resolve immediately no matter
  // what delay was requested" — there is no fixed delay to key the behavior on. calledWith([])
  // still records whichever delay was actually passed, via the closure below.
  setTimeoutSpy.calledWith([]).implement(((callback: () => void, ms: number) => {
    captured.delayMs = ElapsedMsStub({ value: ms });
    callback();
    return 0 as never;
  }) as never);

  return {
    resolveImmediately: (): void => {
      // No-op — implementation invokes the callback synchronously via the spy above.
    },
    getRegisteredDelay: (): ElapsedMs | undefined => captured.delayMs,
  };
};
