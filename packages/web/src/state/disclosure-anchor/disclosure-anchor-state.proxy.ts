import { disclosureAnchorState } from './disclosure-anchor-state';

export const disclosureAnchorStateProxy = (): {
  setupReleased: () => void;
  setupHeld: () => void;
  isHeld: () => boolean;
} => ({
  // The module singleton outlives a test FILE, and a real hold is released a frame later by a
  // requestAnimationFrame jest never runs — so any test asserting the hold must open from a known
  // release rather than from whatever the test before it clicked.
  setupReleased: (): void => {
    disclosureAnchorState.releaseAll();
  },

  setupHeld: (): void => {
    disclosureAnchorState.hold();
  },

  isHeld: (): boolean => disclosureAnchorState.isHeld(),
});
