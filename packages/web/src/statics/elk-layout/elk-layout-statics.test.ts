import { elkLayoutStatics } from './elk-layout-statics';

describe('elkLayoutStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(elkLayoutStatics).toStrictEqual({
      node: {
        width: 240,
      },
      labelEstimate: {
        charsPerLine: 18,
        lineHeight: 16,
        chromeHeight: 40,
        badgeHeight: 22,
        packageRow: {
          charsPerLine: 22,
          chipOverheadChars: 5,
          lineHeight: 22,
        },
        buffer: 12,
      },
      observable: {
        width: 220,
        gap: 56,
        rowGap: 12,
        labelEstimate: {
          charsPerLine: 26,
          lineHeight: 15,
          chromeHeight: 52,
          buffer: 10,
        },
      },
      spacing: {
        nodeNode: 300,
        nodeNodeBetweenLayers: 140,
        edgeNode: 300,
        edgeEdge: 20,
      },
      edgeLabel: {
        maxWidth: 160,
        midpointDivisor: 2,
      },
      loop: {
        detour: 60,
      },
      viewport: {
        minZoom: 0.1,
        maxZoom: 1,
        topPadding: 24,
        sidePadding: 24,
        centerDivisor: 2,
      },
    });
  });

  // An assertion column is painted beside its card and is invisible to ELK, so the ONLY thing
  // keeping a same-layer neighbour out of it is the horizontal clearance below. Which of the two
  // knobs applies is decided by what ELK put next to the card — another card, or the dummy it
  // splits a multi-layer edge into — so a column is only safe when BOTH clear its span. Both cases
  // need their own assertion: a suite checking `nodeNode` alone reads green while every layer a
  // back-edge crosses paints one card's assertions over the next card.
  describe('an assertion column fits in the clearance ELK keeps beside its card', () => {
    const columnSpan = elkLayoutStatics.observable.gap + elkLayoutStatics.observable.width;

    it('VALID: spacing.nodeNode => is at least the column span, so a sibling CARD never sits under a column', () => {
      expect(elkLayoutStatics.spacing.nodeNode).toBeGreaterThanOrEqual(columnSpan);
    });

    it('VALID: spacing.edgeNode => is at least the column span, so a card across a routed edge never sits under a column', () => {
      expect(elkLayoutStatics.spacing.edgeNode).toBeGreaterThanOrEqual(columnSpan);
    });

    it('VALID: spacing.nodeNode => also clears a wrapping branch-edge label between siblings', () => {
      expect(elkLayoutStatics.spacing.nodeNode).toBeGreaterThanOrEqual(
        elkLayoutStatics.edgeLabel.maxWidth,
      );
    });
  });
});
