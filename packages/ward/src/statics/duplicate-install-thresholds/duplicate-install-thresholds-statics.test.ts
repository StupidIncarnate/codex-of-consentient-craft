import { duplicateInstallThresholdsStatics } from './duplicate-install-thresholds-statics';

describe('duplicateInstallThresholdsStatics', () => {
  describe('valid inputs', () => {
    it('VALID: {} => minimumLocationsForViolation is 2', () => {
      expect(duplicateInstallThresholdsStatics.counts.minimumLocationsForViolation).toBe(2);
    });
  });
});
