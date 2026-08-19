import { disclosureAnchorState } from './disclosure-anchor-state';
import { disclosureAnchorStateProxy } from './disclosure-anchor-state.proxy';

describe('disclosureAnchorState', () => {
  describe('holding', () => {
    it('EMPTY: {nothing held} => reads as released', () => {
      disclosureAnchorStateProxy().setupReleased();

      expect(disclosureAnchorState.isHeld()).toBe(false);
    });

    it('VALID: {one hold} => reads as held', () => {
      disclosureAnchorStateProxy().setupReleased();

      disclosureAnchorState.hold();

      expect(disclosureAnchorState.isHeld()).toBe(true);
    });

    it('VALID: {hold then release} => reads as released', () => {
      disclosureAnchorStateProxy().setupReleased();

      disclosureAnchorState.hold();
      disclosureAnchorState.release();

      expect(disclosureAnchorState.isHeld()).toBe(false);
    });
  });

  describe('two disclosures settling in one frame', () => {
    // The reason this is a count and not a flag: the first release must not hand the auto-scroll
    // the second disclosure's own resize.
    it('VALID: {two holds, one release} => still reads as held', () => {
      disclosureAnchorStateProxy().setupReleased();

      disclosureAnchorState.hold();
      disclosureAnchorState.hold();
      disclosureAnchorState.release();

      expect(disclosureAnchorState.isHeld()).toBe(true);
    });

    it('VALID: {two holds, two releases} => reads as released', () => {
      disclosureAnchorStateProxy().setupReleased();

      disclosureAnchorState.hold();
      disclosureAnchorState.hold();
      disclosureAnchorState.release();
      disclosureAnchorState.release();

      expect(disclosureAnchorState.isHeld()).toBe(false);
    });
  });

  describe('release without a hold', () => {
    // A stranded negative count would swallow the NEXT real hold and silently disable the
    // auto-scroll for the rest of the session.
    it('EDGE: {release with nothing held, then hold} => reads as held', () => {
      disclosureAnchorStateProxy().setupReleased();

      disclosureAnchorState.release();
      disclosureAnchorState.hold();

      expect(disclosureAnchorState.isHeld()).toBe(true);
    });
  });

  describe('releaseAll', () => {
    it('VALID: {two holds, releaseAll} => reads as released', () => {
      disclosureAnchorStateProxy().setupReleased();

      disclosureAnchorState.hold();
      disclosureAnchorState.hold();
      disclosureAnchorState.releaseAll();

      expect(disclosureAnchorState.isHeld()).toBe(false);
    });
  });
});
