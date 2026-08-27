import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

// setInterval(callback, intervalMs) — the callback is opaque, but the delay is a real,
// known address: every caller passes a fixed constant (a broker's own tick interval or a
// test-supplied value). passthrough:true keeps any OTHER interval running elsewhere in
// the process (e.g. ServerInitResponder's own flush interval) ticking for real instead of
// throwing on an unmatched call.
export const timerSetIntervalAdapterProxy = ({
  intervalMs,
}: {
  intervalMs: number;
}): {
  triggerTick: () => void;
  getRegisteredCallback: () => (() => void) | undefined;
  getClearedHandles: () => readonly unknown[];
} => {
  const captured: { callback: (() => void) | undefined } = { callback: undefined };
  const cleared: { handles: unknown[] } = { handles: [] };

  const setIntervalSpy = registerSpyOn({
    object: globalThis,
    method: 'setInterval',
    passthrough: true,
  });
  setIntervalSpy
    .calledWith([(callback: unknown) => typeof callback === 'function', intervalMs])
    .implement(((callback: () => void) => {
      captured.callback = callback;
      return 0 as never;
    }) as never);

  const clearIntervalSpy = registerSpyOn({
    object: globalThis,
    method: 'clearInterval',
    passthrough: true,
  });
  // The fake handle above always returns 0 — that is the real value clearInterval receives.
  clearIntervalSpy.calledWith([0]).implement(((handle: unknown) => {
    cleared.handles.push(handle);
    return undefined;
  }) as never);

  return {
    triggerTick: (): void => {
      if (captured.callback) {
        captured.callback();
      }
    },
    getRegisteredCallback: (): (() => void) | undefined => captured.callback,
    getClearedHandles: (): readonly unknown[] => cleared.handles,
  };
};
