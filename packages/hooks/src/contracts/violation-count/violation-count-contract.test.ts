import { violationCountContract } from './violation-count-contract';
import { ViolationCountStub } from './violation-count.stub';
import { ViolationDetailStub } from '../violation-detail/violation-detail.stub';

describe('violationCountContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = ViolationCountStub();

    expect(result).toStrictEqual({
      ruleId: '@typescript-eslint/no-explicit-any',
      count: 1,
      details: [ViolationDetailStub()],
    });
  });

  it('VALID: {multiple violations} => parses successfully', () => {
    const result = ViolationCountStub({
      ruleId: 'no-console',
      count: 3,
      details: [
        ViolationDetailStub({ ruleId: 'no-console', line: 1 }),
        ViolationDetailStub({ ruleId: 'no-console', line: 2 }),
        ViolationDetailStub({ ruleId: 'no-console', line: 3 }),
      ],
    });

    expect(result.count).toBe(3);
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return violationCountContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
