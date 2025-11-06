import { ViolationCountStub } from './violation-count.stub';
import { ViolationDetailStub } from '../violation-detail/violation-detail.stub';

describe('violationCountContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = ViolationCountStub();

    expect(result.ruleId).toBe('@typescript-eslint/no-explicit-any');
    expect(result.count).toBe(1);
    expect(result.details[0].ruleId).toBe('@typescript-eslint/no-explicit-any');
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
});
