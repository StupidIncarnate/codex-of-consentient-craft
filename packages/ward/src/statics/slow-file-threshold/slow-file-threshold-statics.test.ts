import { slowFileThresholdStatics } from './slow-file-threshold-statics';

const ALLOWANCE_ENTRIES = Object.entries(slowFileThresholdStatics.allowed);

describe('slowFileThresholdStatics', () => {
  it('VALID: exported thresholds => match expected shape', () => {
    expect(slowFileThresholdStatics.threshold).toStrictEqual({
      warnMs: 5000,
      testWarnMs: 1000,
      integrationTestWarnMs: 3000,
      lintRulesWarnMs: 1000,
      e2eTestWarnMs: 5000,
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

  it('VALID: the integration bar => sits above the unit bar, because a spawned child costs a second', () => {
    expect(slowFileThresholdStatics.threshold.integrationTestWarnMs).toBeGreaterThan(
      slowFileThresholdStatics.threshold.testWarnMs,
    );
  });

  // An allowance under the bar excuses nothing — the bar already lets that file through — so it is
  // an entry someone forgot to delete after making the file fast, and it reads as a live exception.
  it.each(ALLOWANCE_ENTRIES)(
    'VALID: {allowance: %s} => is looser than the integration bar it overrides',
    (_filePath, allowance) => {
      expect(allowance.testMs).toBeGreaterThan(
        slowFileThresholdStatics.threshold.integrationTestWarnMs,
      );
    },
  );

  // A number with no reason beside it is a number nobody can review, and the whole point of an
  // allowance is that it is a written decision rather than a silent exemption.
  it.each(ALLOWANCE_ENTRIES)(
    'VALID: {allowance: %s} => carries a reason a reader can act on',
    (_filePath, allowance) => {
      expect(allowance.why.length).toBeGreaterThan(30);
    },
  );

  // The key is matched against the END of jest's absolute path, so a leading slash or a `./` would
  // never match and the allowance would silently do nothing.
  it.each(ALLOWANCE_ENTRIES)(
    'VALID: {allowance: %s} => is a repo-relative path under packages/',
    (filePath) => {
      expect(filePath.startsWith('packages/')).toBe(true);
    },
  );
});
