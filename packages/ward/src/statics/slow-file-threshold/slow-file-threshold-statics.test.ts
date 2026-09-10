import { slowFileThresholdStatics } from './slow-file-threshold-statics';

describe('slowFileThresholdStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(slowFileThresholdStatics).toStrictEqual({
      threshold: {
        warnMs: 5000,
        testWarnMs: 1000,
      },
    });
  });

  it('VALID: the two thresholds => the test-body bar is the stricter one', () => {
    expect(slowFileThresholdStatics.threshold.testWarnMs).toBeLessThan(
      slowFileThresholdStatics.threshold.warnMs,
    );
  });
});
