import { violationMessageFormatTransformer } from './violation-message-format-transformer';
import { ViolationCountStub } from '../../contracts/violation-count/violation-count.stub';

type ViolationCount = ReturnType<typeof ViolationCountStub>;

describe('violationMessageFormatTransformer', () => {
  it('VALID: {violations: []} => returns basic message', () => {
    const violations: ViolationCount[] = [];

    const message = violationMessageFormatTransformer({ violations });

    expect(message).toBe(`🛑 New code quality violations detected:

These rules help maintain code quality and safety. Please fix the violations.`);
  });

  it('VALID: {violations: [1 any]} => returns formatted message', () => {
    const violations: ViolationCount[] = [
      ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
    ];

    const message = violationMessageFormatTransformer({ violations });

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

    const message = violationMessageFormatTransformer({ violations });

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
