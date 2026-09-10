import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

// setInterval(callback, intervalMs) — the callback is opaque, but the delay is a real,
// known address: every caller passes a fixed constant (a broker's own tick interval or a
// test-supplied value). passthrough:true keeps any OTHER interval registered elsewhere in
// the process (e.g. by unrelated code under test) ticking for real instead of throwing.
export const timerSetIntervalAdapterProxy = ({
  intervalMs,
}: {
  intervalMs: number;
}): {
  triggerTick: () => void;
  getRegisteredCallback: () => (() => void) | undefined;
} => {
  const captured: { callback: (() => void) | undefined } = { callback: undefined };
  // An OBJECT, not the number this used to hand back: the adapter calls `.unref()` on what
  // `setInterval` returns, and a number has no such method. `hasRef` answers false to match, so a
  // leak reporter reading this handle agrees with the adapter about what it did.
  const fakeHandle = {
    unref: (): void => undefined,
    ref: (): void => undefined,
    hasRef: (): boolean => false,
  };

  const setIntervalSpy = registerSpyOn({
    object: globalThis,
    method: 'setInterval',
    passthrough: true,
  });
  setIntervalSpy
    .calledWith([(callback: unknown) => typeof callback === 'function', intervalMs])
    .implement(((callback: () => void) => {
      captured.callback = callback;
      return fakeHandle as never;
    }) as never);

  const clearIntervalSpy = registerSpyOn({
    object: globalThis,
    method: 'clearInterval',
    passthrough: true,
  });
  // The fake handle above is what clearInterval really receives.
  clearIntervalSpy.calledWith([fakeHandle]).implement((() => undefined) as never);

  return {
    triggerTick: (): void => {
      if (captured.callback) {
        captured.callback();
      }
    },
    getRegisteredCallback: (): (() => void) | undefined => captured.callback,
  };
};
