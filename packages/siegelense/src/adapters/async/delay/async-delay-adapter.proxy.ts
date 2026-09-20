import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { TimeoutMsStub } from '@dungeonmaster/shared/contracts';

type TimeoutMs = ReturnType<typeof TimeoutMsStub>;

export const asyncDelayAdapterProxy = (): {
  getRequestedDelay: () => TimeoutMs | undefined;
} => {
  const state: { delayMs: TimeoutMs | undefined } = { delayMs: undefined };

  const setTimeoutSpy = registerSpyOn({
    object: globalThis,
    method: 'setTimeout',
    passthrough: true,
  });

  setTimeoutSpy.calledWith([]).implement(((callback: () => void, ms: TimeoutMs) => {
    state.delayMs = TimeoutMsStub({ value: ms });
    callback();
    return 0 as never;
  }) as never);

  return {
    getRequestedDelay: (): TimeoutMs | undefined => state.delayMs,
  };
};
