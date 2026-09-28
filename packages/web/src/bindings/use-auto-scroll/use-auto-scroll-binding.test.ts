import { renderHook } from '#gateway/npm/testing-library__react';
import { useAutoScrollBinding } from './use-auto-scroll-binding';
import { useAutoScrollBindingProxy } from './use-auto-scroll-binding.proxy';

describe('useAutoScrollBinding', () => {
  describe('return shape', () => {
    it('VALID: {} => scrollContainerProps ref starts as null', () => {
      useAutoScrollBindingProxy().setup();

      const { result } = renderHook(() => useAutoScrollBinding());

      expect(result.current.scrollContainerProps.ref.current).toBe(null);
    });

    it('VALID: {} => scrollContainerProps has onScroll handler', () => {
      useAutoScrollBindingProxy().setup();

      const { result } = renderHook(() => useAutoScrollBinding());

      expect(result.current.scrollContainerProps.onScroll).toStrictEqual(expect.any(Function));
    });

    it('VALID: {} => contentRef starts as null', () => {
      useAutoScrollBindingProxy().setup();

      const { result } = renderHook(() => useAutoScrollBinding());

      expect(result.current.contentRef.current).toBe(null);
    });
  });
});
