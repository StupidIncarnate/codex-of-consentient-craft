import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { useDisclosureAnchorBinding } from './use-disclosure-anchor-binding';
import { useDisclosureAnchorBindingProxy } from './use-disclosure-anchor-binding.proxy';

describe('useDisclosureAnchorBinding', () => {
  describe('holding the auto-scroll', () => {
    it('EMPTY: {mounted, nothing clicked} => leaves the auto-scroll alone', () => {
      const proxy = useDisclosureAnchorBindingProxy();
      proxy.setupReleased();

      testingLibraryRenderHookAdapter({ renderCallback: () => useDisclosureAnchorBinding() });

      expect(proxy.isHeld()).toBe(false);
    });

    it('VALID: {holdAnchor} => puts the auto-scroll on hold', () => {
      const proxy = useDisclosureAnchorBindingProxy();
      proxy.setupReleased();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDisclosureAnchorBinding(),
      });
      result.current.holdAnchor();

      expect(proxy.isHeld()).toBe(true);
    });

    // The hold is taken before any measuring, so a control with no scrollport above it still
    // suppresses the jump. Making suppression conditional on geometry the caller cannot see is how
    // it would come back for exactly the layouts nobody tested.
    it('EDGE: {holdAnchor with no anchor attached} => still puts the auto-scroll on hold', () => {
      const proxy = useDisclosureAnchorBindingProxy();
      proxy.setupReleased();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDisclosureAnchorBinding(),
      });
      result.current.anchorRef(null);
      result.current.holdAnchor();

      expect(proxy.isHeld()).toBe(true);
    });

    it('VALID: {two holds} => stays held until both are released', () => {
      const proxy = useDisclosureAnchorBindingProxy();
      proxy.setupReleased();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDisclosureAnchorBinding(),
      });
      result.current.holdAnchor();
      result.current.holdAnchor();

      expect(proxy.isHeld()).toBe(true);

      proxy.advanceFrame();

      expect(proxy.isHeld()).toBe(true);

      proxy.advanceFrame();

      expect(proxy.isHeld()).toBe(false);
    });
  });

  describe('frame-controlled release', () => {
    it('VALID: {holdAnchor, one frame advanced} => still held', () => {
      const proxy = useDisclosureAnchorBindingProxy();
      proxy.setupReleased();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDisclosureAnchorBinding(),
      });
      result.current.holdAnchor();
      proxy.advanceFrame();

      expect(proxy.isHeld()).toBe(true);
    });

    it('VALID: {holdAnchor, two frames advanced} => released', () => {
      const proxy = useDisclosureAnchorBindingProxy();
      proxy.setupReleased();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDisclosureAnchorBinding(),
      });
      result.current.holdAnchor();
      proxy.advanceFrame();
      proxy.advanceFrame();

      expect(proxy.isHeld()).toBe(false);
    });

    // A reader opening one disclosure and a later one is two INDEPENDENT release chains, and the
    // second must still get its own two frames. This is what pins the drain to advancing one frame
    // of the chain rather than replaying every frame it has ever recorded: a replaying drain runs
    // the drained chain's release again here, and `release()` floors at 0, so the second hold is
    // wiped by the first one's echo.
    it('VALID: {a released hold, then a second hold, one frame advanced} => the second hold survives', () => {
      const proxy = useDisclosureAnchorBindingProxy();
      proxy.setupReleased();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDisclosureAnchorBinding(),
      });
      result.current.holdAnchor();
      proxy.advanceFrame();
      proxy.advanceFrame();

      expect(proxy.isHeld()).toBe(false);

      result.current.holdAnchor();
      proxy.advanceFrame();

      expect(proxy.isHeld()).toBe(true);
    });
  });

  describe('anchor ref', () => {
    it('VALID: {re-rendered} => hands back the same callback ref, so React never detaches it', () => {
      useDisclosureAnchorBindingProxy().setupReleased();

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useDisclosureAnchorBinding(),
      });
      const firstRef = result.current.anchorRef;
      rerender();

      expect(result.current.anchorRef).toBe(firstRef);
    });
  });
});
