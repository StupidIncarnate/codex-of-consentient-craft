import { blightConcernLegendStatics } from '../blight-concern-legend/blight-concern-legend-statics';
import { blightChecklistLimitsStatics } from './blight-checklist-limits-statics';

describe('blightChecklistLimitsStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => caps rendered review units before the checklist truncates', () => {
      expect(blightChecklistLimitsStatics).toStrictEqual({
        maxUnits: 1200,
      });
    });
  });

  describe('the cap is set by the character ceiling, sized against the largest real diff', () => {
    it('VALID: {maxUnits} => sits above the largest real diff measured against this repo (680 units), so truncation is rare enough to be reportable', () => {
      expect(blightChecklistLimitsStatics.maxUnits).toBeGreaterThan(680);
    });

    it('VALID: {maxUnits} => is a whole multiple of the four concerns (blightConcernLegendStatics.byConcern, pinned 1:1 with blightConcernContract), so a truncation split lands on a concern boundary', () => {
      const concernCount = Object.keys(blightConcernLegendStatics.byConcern).length;

      expect(blightChecklistLimitsStatics.maxUnits % concernCount).toBe(0);
    });
  });
});
