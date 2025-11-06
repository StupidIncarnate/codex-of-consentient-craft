import { ViolationComparisonStub } from './violation-comparison.stub';

describe('violationComparisonContract', () => {
  it('VALID: {no new violations} => parses successfully', () => {
    const result = ViolationComparisonStub();

    expect(result).toStrictEqual({
      hasNewViolations: false,
      newViolations: [],
      message: 'No new violations detected',
    });
  });

  it('VALID: {with new violations} => parses successfully', () => {
    const result = ViolationComparisonStub({
      hasNewViolations: true,
      message: 'Found 2 new violations',
    });

    expect(result.hasNewViolations).toBe(true);
    expect(result.message).toBe('Found 2 new violations');
  });

  it('VALID: {without message} => parses successfully', () => {
    const result = ViolationComparisonStub({
      message: undefined,
    });

    expect(result.message).toBeUndefined();
  });
});
