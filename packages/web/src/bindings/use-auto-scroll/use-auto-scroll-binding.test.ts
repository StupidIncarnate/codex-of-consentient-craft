import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { useAutoScrollBinding } from './use-auto-scroll-binding';
import { useAutoScrollBindingProxy } from './use-auto-scroll-binding.proxy';

describe('useAutoScrollBinding', () => {
  describe('return shape', () => {
    it('VALID: {trigger: 0} => scrollContainerProps ref starts as null', () => {
      useAutoScrollBindingProxy().setup();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useAutoScrollBinding({ trigger: 0 }),
      });

      expect(result.current.scrollContainerProps.ref.current).toBe(null);
    });

    it('VALID: {trigger: 0} => scrollContainerProps has onScroll handler', () => {
      useAutoScrollBindingProxy().setup();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useAutoScrollBinding({ trigger: 0 }),
      });

      expect(result.current.scrollContainerProps.onScroll).toStrictEqual(expect.any(Function));
    });

    it('VALID: {trigger: 0} => scrollEndRef starts as null', () => {
      useAutoScrollBindingProxy().setup();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useAutoScrollBinding({ trigger: 0 }),
      });

      expect(result.current.scrollEndRef.current).toBe(null);
    });
  });
});
