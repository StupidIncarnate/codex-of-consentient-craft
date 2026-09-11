import { slowFileThresholdStatics } from './slow-file-threshold-statics';

describe('slowFileThresholdStatics', () => {
  it('VALID: exported thresholds => match expected shape', () => {
    expect(slowFileThresholdStatics.threshold).toStrictEqual({
      warnMs: 5000,
      testWarnMs: 1000,
      integrationTestWarnMs: 3000,
      lintRulesWarnMs: 2000,
      e2eTestWarnMs: 10_000,
    });
  });

  it('VALID: the browser bar => sits above every other, because a spec drives a real server and a real browser', () => {
    expect(slowFileThresholdStatics.threshold.e2eTestWarnMs).toBeGreaterThan(
      slowFileThresholdStatics.threshold.integrationTestWarnMs,
    );
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

  it('VALID: the integration bar => sits above the unit bar, because a spawned child costs a second', () => {
    expect(slowFileThresholdStatics.threshold.integrationTestWarnMs).toBeGreaterThan(
      slowFileThresholdStatics.threshold.testWarnMs,
    );
  });
});
