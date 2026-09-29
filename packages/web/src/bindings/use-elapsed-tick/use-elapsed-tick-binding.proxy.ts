/**
 * PURPOSE: Stages Date.now() and the gateway setInterval/clearInterval proxies so tests can drive
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

import { document } from '#gateway/browser/document';
import { clearIntervalProxy } from '#gateway/browser/clearInterval/clear-interval/clear-interval.proxy';
import { IntervalHandleStub } from '#gateway/browser/setInterval/interval-handle.stub';
import { setIntervalProxy } from '#gateway/browser/setInterval/set-interval/set-interval.proxy';

import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

const DEFAULT_NOW_MS = 1_700_000_000_000;

type TickCallCount = ReturnType<SpyOnHandle['callsMatching']>['length'];

// The visibilitychange listener's own address: 'visibilitychange' plus a function, so counts here
// never fold in a listener some OTHER piece of code (React, Mantine, jsdom itself) registers for a
// different event type.
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

  // The gateway proxies pass through, so React's and Mantine's own timers still work; the staged
  // address overrides only OUR interval, the one registered at the statics tick period.
  const tickHandle = IntervalHandleStub();
  const intervalProxy = setIntervalProxy();
  intervalProxy.stageHandle({
    delay: elapsedDisplayConfigStatics.refresh.tickMs,
    handle: tickHandle,
  });
  const clearProxy = clearIntervalProxy();

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
      intervalProxy.getCallsFor({ delay: elapsedDisplayConfigStatics.refresh.tickMs }).length,
    getClearedTickCount: (): TickCallCount => clearProxy.getCallsFor({ handle: tickHandle }).length,
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
      const calls = intervalProxy.getCallsFor({
        delay: elapsedDisplayConfigStatics.refresh.tickMs,
      });
      const lastCall = [...calls].pop();
      (lastCall?.[0] as (() => void) | undefined)?.();
    },
  };
};
