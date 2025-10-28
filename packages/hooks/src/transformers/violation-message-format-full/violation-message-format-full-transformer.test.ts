import { violationMessageFormatFullTransformer } from './violation-message-format-full-transformer';
import type { ViolationCount } from '../../contracts/violation-count/violation-count-contract';
import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { preEditLintConfigContract } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { ViolationCountStub } from '../../contracts/violation-count/violation-count.stub';
import { ViolationDetailStub } from '../../contracts/violation-detail/violation-detail.stub';

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
      const config: PreEditLintConfig = preEditLintConfigContract.parse({ rules: [] });

      const result = violationMessageFormatFullTransformer({
        violations,
        config,
        hookData: {},
      });

      expect(result).toContain('🛑 New code quality violations detected:');
      expect(result).toContain('❌ Type Safety Violation: 1 violation');
      expect(result).toContain(
        'Using type "any" violates TypeScript\'s type safety rules. Go explore types for this project and use a known or make a new type to use.',
      );
      expect(result).toContain('Line 5:10 - Unexpected any');
      expect(result).toContain(
        'These rules help maintain code quality and safety. Please fix the violations.',
      );
    });

    it('VALID: {violations: empty array} => returns header and footer only', () => {
      const violations: ViolationCount[] = [];
      const config: PreEditLintConfig = preEditLintConfigContract.parse({ rules: [] });

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
      const config: PreEditLintConfig = preEditLintConfigContract.parse({
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

      expect(result).toContain('❌ Custom Rule Name: 1 violation');
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
      const config: PreEditLintConfig = preEditLintConfigContract.parse({
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

      expect(result).toContain('This is a custom message explaining the rule.');
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
      const config: PreEditLintConfig = preEditLintConfigContract.parse({
        rules: [
          {
            rule: 'custom-rule',
            message: (hookData: unknown) => {
              return `Dynamic message for ${JSON.stringify(hookData)}`;
            },
          },
        ],
      });

      const result = violationMessageFormatFullTransformer({
        violations,
        config,
        hookData: { test: 'data' },
      });

      expect(result).toContain('Dynamic message for {"test":"data"}');
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
      const config: PreEditLintConfig = preEditLintConfigContract.parse({
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

      expect(result).toContain('Custom message function failed: Function failed');
    });
  });
});
