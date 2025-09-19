import { violationAnalyzerUtilFormatViolationMessage } from './violation-analyzer-util-format-violation-message';
import type { ViolationCount } from '../../types/lint-type';
import { ViolationCountStub } from '../../../test/stubs/violation.stub';

describe('violationAnalyzerUtilFormatViolationMessage', () => {
  it('VALID: {violations: []} => returns basic message', () => {
    const violations: ViolationCount[] = [];

    const message = violationAnalyzerUtilFormatViolationMessage({ violations });

    expect(message).toBe(`🛑 New code quality violations detected:

These rules help maintain code quality and safety. Please fix the violations.`);
  });

  it('VALID: {violations: [1 any]} => returns formatted message', () => {
    const violations: ViolationCount[] = [
      ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
    ];

    const message = violationAnalyzerUtilFormatViolationMessage({ violations });

    expect(message).toBe(`🛑 New code quality violations detected:
  ❌ Code Quality Issue: 1 violation
     Line 1:15 - Unexpected any. Specify a different type.

These rules help maintain code quality and safety. Please fix the violations.`);
  });

  it('VALID: {violations: [multiple violations]} => returns formatted message with plurals', () => {
    const violations: ViolationCount[] = [
      ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 3 }),
      ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
      ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 2 }),
    ];

    const message = violationAnalyzerUtilFormatViolationMessage({ violations });

    expect(message).toBe(`🛑 New code quality violations detected:
  ❌ Code Quality Issue: 3 violations
     Line 1:15 - Unexpected any. Specify a different type.
  ❌ Code Quality Issue: 1 violation
     Line 1:15 - Unexpected any. Specify a different type.
  ❌ Code Quality Issue: 2 violations
     Line 1:15 - Unexpected any. Specify a different type.

These rules help maintain code quality and safety. Please fix the violations.`);
  });
});
