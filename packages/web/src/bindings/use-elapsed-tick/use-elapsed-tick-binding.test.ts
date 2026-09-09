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
});
