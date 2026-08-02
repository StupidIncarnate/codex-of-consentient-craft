import { qaChecklistLimitsStatics } from './qa-checklist-limits-statics';

describe('qaChecklistLimitsStatics', () => {
  describe('full exported value', () => {
    it('VALID: {statics} => caps enumerated paths per flow', () => {
      expect(qaChecklistLimitsStatics).toStrictEqual({
        maxPaths: 200,
      });
    });
  });

  describe('the cap is a backstop, not a working constraint', () => {
    it('VALID: {maxPaths} => sits far above the largest observed real flow, so truncation is rare enough to be reportable', () => {
      expect(qaChecklistLimitsStatics.maxPaths).toBeGreaterThan(7);
    });
  });
});
