import { unitChurnStatics } from './unit-churn-statics';

describe('unitChurnStatics', () => {
  it('VALID: {limits.minMarksForChurn} => is 2', () => {
    expect(unitChurnStatics.limits.minMarksForChurn).toBe(2);
  });
});
