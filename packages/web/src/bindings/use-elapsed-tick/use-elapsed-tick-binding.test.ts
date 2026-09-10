import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

import { useElapsedTickBinding } from './use-elapsed-tick-binding';
import { useElapsedTickBindingProxy } from './use-elapsed-tick-binding.proxy';

describe('useElapsedTickBinding', () => {
  describe('initial read', () => {
    // enabled: false means the effect's guard returns before it ever calls setNowMs, so the ONLY
    // thing that can supply this value is the useState initialiser reading Date.now() eagerly at
    // construction. A non-lazy `useState(0)` would read epoch here instead of the mocked instant.
    it('EDGE: {enabled: false, mounted 4 minutes into a run} => now reads the current instant from the initialiser, with no tick ever registered', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 240_000 });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: false }),
      });

      expect(result.current.now).toBe('1970-01-01T00:04:00.000Z');
      expect(proxy.getTickIntervalCount()).toBe(0);
    });
  });

  describe('ticking', () => {
    it('VALID: {one tick fired} => now advances by exactly one tick period', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });

      proxy.advanceNowMs({ ms: elapsedDisplayConfigStatics.refresh.tickMs });
      testingLibraryActAdapter({
        callback: () => {
          proxy.fireTick();
        },
      });

      expect(result.current.now).toBe('1970-01-01T00:01:00.000Z');
    });
  });

  describe('backgrounded tab resync', () => {
    // A hidden tab's setInterval can be throttled or fully suspended by the browser's own power
    // policy, so the scheduled tick can silently miss its period entirely while the tab is
    // backgrounded. Advancing the mocked clock WITHOUT calling proxy.fireTick() reproduces exactly
    // that: real time has moved on, but nothing has pushed a fresh reading into the hook yet — the
    // state a user lands in the instant they refocus the tab.
    it('EDGE: {interval suspended five tick periods, tab foregrounded via visibilitychange} => now resyncs to the current instant immediately', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });

      proxy.advanceNowMs({ ms: elapsedDisplayConfigStatics.refresh.tickMs * 5 });

      testingLibraryActAdapter({
        callback: () => {
          Object.defineProperty(document, 'hidden', { value: false, configurable: true });
          document.dispatchEvent(new Event('visibilitychange'));
        },
      });

      expect(result.current.now).toBe('1970-01-01T00:05:00.000Z');
    });
  });

  describe('enabled: false', () => {
    it('EMPTY: {enabled: false} => registers zero tick intervals', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });

      testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: false }),
      });

      expect(proxy.getTickIntervalCount()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('VALID: {unmount while enabled} => clears the tick interval', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });

      const { unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });
      unmount();

      expect(proxy.getClearedTickCount()).toBe(1);
    });

    // An unmount that leaves the visibilitychange listener attached is the same class of bug as a
    // leaked interval: the handler keeps a closure over this mount's setNowMs alive, and every
    // later tab-focus event fires it again on a component React has already torn down.
    it('VALID: {unmount while enabled} => removes the visibilitychange listener it registered', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });

      const { unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });
      unmount();

      expect(proxy.getVisibilityChangeListenerCount()).toBe(1);
      expect(proxy.getRemovedVisibilityChangeListenerCount()).toBe(1);
    });

    it('VALID: {enabled flips true then false} => clears the tick interval', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });
      let enabled = true;

      const { rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled }),
      });
      testingLibraryActAdapter({
        callback: () => {
          enabled = false;
          rerender();
        },
      });

      expect(proxy.getClearedTickCount()).toBe(1);
    });
  });

  describe('re-render stability', () => {
    it('VALID: {enabled: true, rerendered three times} => registers exactly one tick interval', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });

      const { rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });
      rerender();
      rerender();
      rerender();

      expect(proxy.getTickIntervalCount()).toBe(1);
    });
  });

  describe('remount cycles', () => {
    // Mirrors navigating away from the execution panel (LOGO_LINK) and back, twice, landing on a
    // third live mount — each of the first two mounts must clear its OWN interval on unmount, or
    // a leaked one from an earlier mount keeps ticking alongside the current mount's interval.
    it('VALID: {mounted, unmounted, mounted, unmounted, mounted a third time} => registers three intervals total and clears exactly two, leaving one live', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });

      const first = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });
      first.unmount();

      const second = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });
      second.unmount();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });

      expect(proxy.getTickIntervalCount()).toBe(3);
      expect(proxy.getClearedTickCount()).toBe(2);
    });
  });

  describe('re-entry after a long gap while unmounted', () => {
    // Mirrors navigating away from the execution panel for several real minutes (a longer version
    // of the "remount cycles" gap) before navigating back. The lazy useState initialiser has no
    // cross-mount memory, so the fresh mount must read the TRUE elapsed time at the later instant —
    // not the instant it was unmounted at — and the interval that resumes afterward must be the
    // single one this new mount registers, not a second one stacked on a leaked first.
    it('VALID: {unmounted while enabled, 2.5 tick periods pass, remounted} => the fresh mount reads the true current instant and exactly one live interval ticks once more', () => {
      const proxy = useElapsedTickBindingProxy();
      proxy.setNowMs({ ms: 0 });

      const first = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });
      first.unmount();

      // The gap happens entirely while nothing is mounted: no tick callback fires here, only the
      // mocked clock moves on.
      proxy.advanceNowMs({ ms: elapsedDisplayConfigStatics.refresh.tickMs * 2.5 });

      const second = testingLibraryRenderHookAdapter({
        renderCallback: () => useElapsedTickBinding({ enabled: true }),
      });
      const readSecondNow = (): ReturnType<typeof useElapsedTickBinding>['now'] =>
        second.result.current.now;

      expect(readSecondNow()).toBe('1970-01-01T00:02:30.000Z');

      proxy.advanceNowMs({ ms: elapsedDisplayConfigStatics.refresh.tickMs });
      testingLibraryActAdapter({
        callback: () => {
          proxy.fireTick();
        },
      });

      // Exactly one further step — not a multi-tick catch-up jump for the gap that passed while
      // unmounted, and not zero.
      expect(readSecondNow()).toBe('1970-01-01T00:03:30.000Z');
      // Two intervals ever registered (one per mount), one cleared (the first mount's unmount) —
      // exactly one live interval is what fired the tick above.
      expect(proxy.getTickIntervalCount()).toBe(2);
      expect(proxy.getClearedTickCount()).toBe(1);
    });
  });
});
