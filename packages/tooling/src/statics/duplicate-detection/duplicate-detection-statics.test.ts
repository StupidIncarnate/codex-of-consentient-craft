import { duplicateDetectionStatics } from './duplicate-detection-statics';

describe('duplicateDetectionStatics', () => {
  it('VALID: defaults.threshold => returns 3', () => {
    expect(duplicateDetectionStatics.defaults.threshold).toBe(3);
  });

  it('VALID: defaults.minLength => returns 3', () => {
    expect(duplicateDetectionStatics.defaults.minLength).toBe(3);
  });
});
