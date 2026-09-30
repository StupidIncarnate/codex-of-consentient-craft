import { computeAnchorScrollTopTransformer } from './compute-anchor-scroll-top-transformer';

describe('computeAnchorScrollTopTransformer', () => {
  describe('content growing above the anchor', () => {
    // "Show N earlier" and an opening sibling both push the clicked control DOWN the scrollport;
    // the scrollport follows by the same amount so the control does not appear to move.
    it('VALID: {anchor drifted 200px down} => scrolls down by 200', () => {
      expect(
        computeAnchorScrollTopTransformer({
          currentScrollTop: 400,
          anchorOffset: 260,
          heldOffset: 60,
          maxScrollTop: 900,
        }),
      ).toBe(600);
    });
  });

  describe('content shrinking above the anchor', () => {
    it('VALID: {anchor drifted 150px up} => scrolls up by 150', () => {
      expect(
        computeAnchorScrollTopTransformer({
          currentScrollTop: 400,
          anchorOffset: 10,
          heldOffset: 160,
          maxScrollTop: 900,
        }),
      ).toBe(250);
    });

    // Collapsing a row the reader scrolled deep into leaves its header far above the fold, which
    // reads negative. This is the case that carries them back UP to what they collapsed.
    it('VALID: {anchor now above the fold} => scrolls up to put it back at the held offset', () => {
      expect(
        computeAnchorScrollTopTransformer({
          currentScrollTop: 2000,
          anchorOffset: -1400,
          heldOffset: 0,
          maxScrollTop: 5000,
        }),
      ).toBe(600);
    });
  });

  describe('the anchor did not move', () => {
    // Opening a sub-agent chain inserts everything BELOW its header, so the arithmetic is a no-op
    // and the whole fix for that case is the auto-scroll standing down.
    it('VALID: {offsets equal} => leaves the scrollport where it is', () => {
      expect(
        computeAnchorScrollTopTransformer({
          currentScrollTop: 320,
          anchorOffset: 44,
          heldOffset: 44,
          maxScrollTop: 900,
        }),
      ).toBe(320);
    });
  });

  describe('clamping', () => {
    it('EDGE: {target below zero} => clamps to the top', () => {
      expect(
        computeAnchorScrollTopTransformer({
          currentScrollTop: 40,
          anchorOffset: 0,
          heldOffset: 500,
          maxScrollTop: 900,
        }),
      ).toBe(0);
    });

    // A collapse shrinks the scrollable range as it runs, so the honest answer routinely lands past
    // the new bottom. Unclamped that is a scrollTop the browser silently rewrites, and the anchor
    // ends up somewhere neither this nor the caller predicted.
    it('EDGE: {target past the new bottom} => clamps to the bottom', () => {
      expect(
        computeAnchorScrollTopTransformer({
          currentScrollTop: 800,
          anchorOffset: 600,
          heldOffset: 0,
          maxScrollTop: 1000,
        }),
      ).toBe(1000);
    });

    it('EDGE: {content shorter than the scrollport} => clamps to zero', () => {
      expect(
        computeAnchorScrollTopTransformer({
          currentScrollTop: 0,
          anchorOffset: 500,
          heldOffset: 0,
          maxScrollTop: 0,
        }),
      ).toBe(0);
    });
  });
});
