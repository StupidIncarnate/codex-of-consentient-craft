import { markdownTypographyStatics } from './markdown-typography-statics';

describe('markdownTypographyStatics', () => {
  describe('shape', () => {
    it('VALID: {statics} => exposes the heading step rule and the block metrics', () => {
      expect(markdownTypographyStatics).toStrictEqual({
        bodyFontSize: 12,
        headingStep: 1,
        headingFlatLevel: 4,
        headingWeight: 700,
        headingGapTop: 12,
        headingRuleMaxLevel: 2,
        headingRulePadding: 3,
        boldWeight: 700,
        blockGap: 4,
        indentPx: 12,
        markerGap: 6,
        codeRadius: 2,
        inlineCodePadding: '0 3px',
        blockCodePadding: '4px 6px',
        quotePadding: 6,
      });
    });
  });
});
