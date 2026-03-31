import { violationMessageFormatFullTransformer } from './violation-message-format-full-transformer';
import { ViolationCountStub } from '../../contracts/violation-count/violation-count.stub';
import { ViolationDetailStub } from '../../contracts/violation-detail/violation-detail.stub';
import { PreEditLintConfigStub } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config.stub';
import { MessageStub } from '../../contracts/message/message.stub';

type ViolationCount = ReturnType<typeof ViolationCountStub>;

describe('violationMessageFormatFullTransformer()', () => {
  describe('basic formatting', () => {
    it('VALID: {violations: single violation, config: empty} => formats message with default display name and message', () => {
      const violations: ViolationCount[] = [
        ViolationCountStub({
          ruleId: '@typescript-eslint/no-explicit-any',
          count: 1,
          details: [
            ViolationDetailStub({
              ruleId: '@typescript-eslint/no-explicit-any',
              line: 5,
              column: 10,
              message: 'Unexpected any',
            }),
          ],
        }),
      ];
      const config = PreEditLintConfigStub({ rules: [] });

      const result = violationMessageFormatFullTransformer({
        violations,
        config,
        hookData: {},
      });

      expect(result).toBe(
        '🛑 New code quality violations detected:\n' +
          '  ❌ Type Safety Violation: 1 violation\n' +
          '     Using type "any" violates TypeScript\'s type safety rules. Go explore types for this project and use a known or make a new type to use.\n' +
          '     Line 5:10 - Unexpected any\n' +
          '\n' +
          'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      );
    });

    it('VALID: {violations: empty array} => returns header and footer only', () => {
      const violations: ViolationCount[] = [];
      const config = PreEditLintConfigStub({ rules: [] });

      const result = violationMessageFormatFullTransformer({
        violations,
        config,
        hookData: {},
      });

      expect(result).toBe(
        '🛑 New code quality violations detected:\n\nThese rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      );
    });
  });

  describe('custom display names', () => {
    it('VALID: {violations: rule with custom display name} => uses custom display name', () => {
      const violations: ViolationCount[] = [
        ViolationCountStub({
          ruleId: 'custom-rule',
          count: 1,
          details: [
            ViolationDetailStub({
              ruleId: 'custom-rule',
              line: 5,
              column: 10,
              message: 'Custom violation',
            }),
          ],
        }),
      ];
      const config = PreEditLintConfigStub({
        rules: [
          {
            rule: 'custom-rule',
            displayName: 'Custom Rule Name',
          },
        ],
      });

      const result = violationMessageFormatFullTransformer({
        violations,
        config,
        hookData: {},
      });

      expect(result).toBe(
        '🛑 New code quality violations detected:\n' +
          '  ❌ Custom Rule Name: 1 violation\n' +
          '     This rule violation should be fixed to maintain code quality.\n' +
          '     Line 5:10 - Custom violation\n' +
          '\n' +
          'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      );
    });
  });

  describe('custom messages', () => {
    it('VALID: {violations: rule with custom string message} => uses custom message', () => {
      const violations: ViolationCount[] = [
        ViolationCountStub({
          ruleId: 'custom-rule',
          count: 1,
          details: [
            ViolationDetailStub({
              ruleId: 'custom-rule',
              line: 5,
              column: 10,
              message: 'Custom violation',
            }),
          ],
        }),
      ];
      const config = PreEditLintConfigStub({
        rules: [
          {
            rule: 'custom-rule',
            message: 'This is a custom message explaining the rule.',
          },
        ],
      });

      const result = violationMessageFormatFullTransformer({
        violations,
        config,
        hookData: {},
      });

      expect(result).toBe(
        '🛑 New code quality violations detected:\n' +
          '  ❌ Code Quality Issue: 1 violation\n' +
          '     This is a custom message explaining the rule.\n' +
          '     Line 5:10 - Custom violation\n' +
          '\n' +
          'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      );
    });

    it('VALID: {violations: rule with custom function message} => calls function and uses result', () => {
      const violations: ViolationCount[] = [
        ViolationCountStub({
          ruleId: 'custom-rule',
          count: 1,
          details: [
            ViolationDetailStub({
              ruleId: 'custom-rule',
              line: 5,
              column: 10,
              message: 'Custom violation',
            }),
          ],
        }),
      ];
      const config = PreEditLintConfigStub({
        rules: [
          {
            rule: 'custom-rule',
            message: (hookData: unknown) => {
              return MessageStub({
                value: `Dynamic message for ${JSON.stringify(hookData)}`,
              });
            },
          },
        ],
      });

      const result = violationMessageFormatFullTransformer({
        violations,
        config,
        hookData: { test: 'data' },
      });

      expect(result).toBe(
        '🛑 New code quality violations detected:\n' +
          '  ❌ Code Quality Issue: 1 violation\n' +
          '     Dynamic message for {"test":"data"}\n' +
          '     Line 5:10 - Custom violation\n' +
          '\n' +
          'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      );
    });

    it('ERROR: {violations: rule with function message that throws} => returns error message', () => {
      const violations: ViolationCount[] = [
        ViolationCountStub({
          ruleId: 'custom-rule',
          count: 1,
          details: [
            ViolationDetailStub({
              ruleId: 'custom-rule',
              line: 5,
              column: 10,
              message: 'Custom violation',
            }),
          ],
        }),
      ];
      const config = PreEditLintConfigStub({
        rules: [
          {
            rule: 'custom-rule',
            message: () => {
              throw new Error('Function failed');
            },
          },
        ],
      });

      const result = violationMessageFormatFullTransformer({
        violations,
        config,
        hookData: {},
      });

      expect(result).toBe(
        '🛑 New code quality violations detected:\n' +
          '  ❌ Code Quality Issue: 1 violation\n' +
          '     Custom message function failed: Function failed\n' +
          '     Line 5:10 - Custom violation\n' +
          '\n' +
          'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      );
    });
  });
});
