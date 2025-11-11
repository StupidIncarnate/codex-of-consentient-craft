import { violationDetailContract } from './violation-detail-contract';
import { ViolationDetailStub } from './violation-detail.stub';

describe('violationDetailContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = ViolationDetailStub();

    expect(result).toStrictEqual({
      ruleId: '@typescript-eslint/no-explicit-any',
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
    });
  });

  it('VALID: {custom violation} => parses successfully', () => {
    const result = ViolationDetailStub({
      ruleId: 'no-console',
      line: 42,
      column: 10,
      message: 'Unexpected console statement.',
    });

    expect(result.ruleId).toBe('no-console');
    expect(result.line).toBe(42);
    expect(result.column).toBe(10);
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return violationDetailContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
