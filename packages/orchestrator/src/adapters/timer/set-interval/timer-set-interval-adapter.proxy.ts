import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const timerSetIntervalAdapterProxy = (): {
  triggerTick: () => void;
  getRegisteredCallback: () => (() => void) | undefined;
} => {
  const captured: { callback: (() => void) | undefined } = { callback: undefined };

  const setIntervalSpy = registerSpyOn({ object: globalThis, method: 'setInterval' });
  setIntervalSpy.mockImplementation(((cb: () => void, _ms: number) => {
    captured.callback = cb;
    return 0 as never;
  }) as never);

  const clearIntervalSpy = registerSpyOn({ object: globalThis, method: 'clearInterval' });
  clearIntervalSpy.mockImplementation((() => undefined) as never);

  return {
    triggerTick: (): void => {
      if (captured.callback) {
        captured.callback();
      }
    },
    getRegisteredCallback: (): (() => void) | undefined => captured.callback,
  };
};
