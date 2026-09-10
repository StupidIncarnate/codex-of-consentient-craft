/**
 * PURPOSE: Stages Date.now() and the global setInterval/clearInterval pair so tests can drive
 * useElapsedTickBinding's single shared timer deterministically — set or advance the mocked "now",
 * then fire the ONE registered tick on demand instead of waiting on a real clock. Also spies on
 * document.addEventListener/removeEventListener('visibilitychange', …) so a test can prove the
 * binding's resync listener is registered and torn down alongside the interval, never left
 * attached past unmount.
 *
 * USAGE:
 * const proxy = useElapsedTickBindingProxy();
 * proxy.setNowMs({ ms: 0 });
 * // ... render the hook ...
 * proxy.advanceNowMs({ ms: elapsedDisplayConfigStatics.refresh.tickMs });
 * proxy.fireTick();
 * // result.current.now now reflects the advanced instant
 */

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

const DEFAULT_NOW_MS = 1_700_000_000_000;
const FAKE_INTERVAL_ID = 424_242;

type TickCallCount = ReturnType<SpyOnHandle['callsMatching']>['length'];

// The tick's own address: a function (the binding's setNowMs re-render callback) at exactly the
// statics tick period. Addressing on this — never "any setInterval call" — is what keeps the counts
// below from folding in React's or Mantine's own timers, which this same spy passes through
// untouched via `passthrough: true`.
const isTickCallbackArg = (value: unknown): boolean => typeof value === 'function';

// The visibilitychange listener's own address: 'visibilitychange' plus a function, the same
// cross-convention shape as isTickCallbackArg above, so counts here never fold in a listener some
// OTHER piece of code (React, Mantine, jsdom itself) registers for a different event type.
const isVisibilityChangeListenerArg = (value: unknown): boolean => typeof value === 'function';

export const useElapsedTickBindingProxy = (): {
  setNowMs: (params: { ms: number }) => void;
  advanceNowMs: (params: { ms: number }) => void;
  getTickIntervalCount: () => TickCallCount;
  getClearedTickCount: () => TickCallCount;
  getVisibilityChangeListenerCount: () => TickCallCount;
  getRemovedVisibilityChangeListenerCount: () => TickCallCount;
  fireTick: () => void;
} => {
  const nowState = { ms: DEFAULT_NOW_MS };
  const nowHandle: SpyOnHandle = registerSpyOn({ object: Date, method: 'now' });
  // Date.now() takes no arguments to key on; `implement` reads the mutable state on every call so
  // setNowMs/advanceNowMs never need to re-stage the address.
  nowHandle.calledWith([]).implement(() => nowState.ms);

  // passthrough so React's and Mantine's own timers still work; the staged address below overrides
  // only OUR interval, the one registered at the statics tick period.
  const setIntervalHandle: SpyOnHandle = registerSpyOn({
    object: globalThis,
    method: 'setInterval',
    passthrough: true,
  });
  setIntervalHandle
    .calledWith([isTickCallbackArg, elapsedDisplayConfigStatics.refresh.tickMs])
    .returns(FAKE_INTERVAL_ID);

  const clearIntervalHandle: SpyOnHandle = registerSpyOn({
    object: globalThis,
    method: 'clearInterval',
    passthrough: true,
  });
  clearIntervalHandle.calledWith([FAKE_INTERVAL_ID]).returns(undefined);

  // passthrough so the real listener actually attaches — the "backgrounded tab resync" test relies
  // on document.dispatchEvent genuinely reaching the binding's own handler, and jsdom's
  // add/removeEventListener already behave correctly with no staged return value needed.
  const addEventListenerHandle: SpyOnHandle = registerSpyOn({
    object: document,
    method: 'addEventListener',
    passthrough: true,
  });
  const removeEventListenerHandle: SpyOnHandle = registerSpyOn({
    object: document,
    method: 'removeEventListener',
    passthrough: true,
  });

  return {
    setNowMs: ({ ms }: { ms: number }): void => {
      nowState.ms = ms;
    },
    advanceNowMs: ({ ms }: { ms: number }): void => {
      nowState.ms += ms;
    },
    getTickIntervalCount: (): TickCallCount =>
      setIntervalHandle.callsMatching([
        isTickCallbackArg,
        elapsedDisplayConfigStatics.refresh.tickMs,
      ]).length,
    getClearedTickCount: (): TickCallCount =>
      clearIntervalHandle.callsMatching([FAKE_INTERVAL_ID]).length,
    getVisibilityChangeListenerCount: (): TickCallCount =>
      addEventListenerHandle.callsMatching(['visibilitychange', isVisibilityChangeListenerArg])
        .length,
    getRemovedVisibilityChangeListenerCount: (): TickCallCount =>
      removeEventListenerHandle.callsMatching(['visibilitychange', isVisibilityChangeListenerArg])
        .length,
    // Pulls the LAST registered tick callback and invokes it directly. The caller wraps this in
    // testingLibraryActAdapter, matching every other binding proxy in this package — act() itself
    // is never staged here, only the mock plumbing is.
    fireTick: (): void => {
      const calls = setIntervalHandle.callsMatching([
        isTickCallbackArg,
        elapsedDisplayConfigStatics.refresh.tickMs,
      ]);
      (calls.at(-1)?.[0] as (() => void) | undefined)?.();
    },
  };
};
