import { disclosureAnchorState } from './disclosure-anchor-state';

export const disclosureAnchorStateProxy = (): {
  setupReleased: () => void;
  setupHeld: () => void;
  isHeld: () => boolean;
} => ({
  // The module singleton outlives a test FILE, and jsdom really does run requestAnimationFrame —
  // it is the binding proxy (use-disclosure-anchor-binding.proxy.ts) that freezes the frame that
  // would release a hold, recording the call rather than firing it. So any test asserting the
  // hold must open from a known release rather than from whatever the test before it clicked.
  setupReleased: (): void => {
    disclosureAnchorState.releaseAll();
  },

  setupHeld: (): void => {
    disclosureAnchorState.hold();
  },

  isHeld: (): boolean => disclosureAnchorState.isHeld(),
});
