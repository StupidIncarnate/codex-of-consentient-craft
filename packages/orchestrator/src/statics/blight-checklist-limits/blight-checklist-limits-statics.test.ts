import { blightChecklistLimitsStatics } from './blight-checklist-limits-statics';

describe('blightChecklistLimitsStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => caps rendered review units before the checklist truncates', () => {
      expect(blightChecklistLimitsStatics).toStrictEqual({
        maxUnits: 1596,
      });
    });
  });

  describe('the cap is a backstop, not a working constraint', () => {
    it('VALID: {maxUnits} => sits above the largest real diff measured against this repo (1,190 units), so truncation is rare enough to be reportable', () => {
      expect(blightChecklistLimitsStatics.maxUnits).toBeGreaterThan(1190);
    });
  });
});
