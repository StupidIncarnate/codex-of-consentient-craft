import { slowFileThresholdStatics } from './slow-file-threshold-statics';

describe('slowFileThresholdStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(slowFileThresholdStatics).toStrictEqual({
      threshold: {
        warnMs: 5000,
        testWarnMs: 1000,
        lintRulesWarnMs: 1000,
        e2eTestWarnMs: 5000,
      },
    });
  });

  it('VALID: the two thresholds => the test-body bar is the stricter one', () => {
    expect(slowFileThresholdStatics.threshold.testWarnMs).toBeLessThan(
      slowFileThresholdStatics.threshold.warnMs,
    );
  });

  it('VALID: the lint bar => is stricter than wall, because it excludes the program build', () => {
    expect(slowFileThresholdStatics.threshold.lintRulesWarnMs).toBeLessThan(
      slowFileThresholdStatics.threshold.warnMs,
    );
  });
});
