import { violationsCountByRuleTransformer } from './violations-count-by-rule-transformer';
import type { LintMessage } from '../../contracts/lint-message/lint-message-contract';
import type { LintResult } from '../../contracts/lint-result/lint-result-contract';
import { LintMessageStub } from '../../contracts/lint-message/lint-message.stub';
import { LintResultStub } from '../../contracts/lint-result/lint-result.stub';
import { ViolationCountStub } from '../../contracts/violation-count/violation-count.stub';
import { ViolationDetailStub } from '../../contracts/violation-detail/violation-detail.stub';

describe('violationsCountByRuleTransformer', () => {
  it('VALID: {results: []} => returns empty array', () => {
    const results: LintResult[] = [];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([]);
  });

  it('VALID: {results: [1 any violation]} => returns correct counts', () => {
    const message: LintMessage = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2, // Error
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const results: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [message],
        errorCount: 1,
        warningCount: 0,
      }),
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      ViolationCountStub({
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 1,
        details: [
          ViolationDetailStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          }),
        ],
      }),
    ]);
  });

  it('VALID: {results: [multiple violations of same rule]} => returns correct counts', () => {
    const message1: LintMessage = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2, // Error
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const message2: LintMessage = LintMessageStub({
      line: 2,
      column: 20,
      message: 'Unexpected any. Specify a different type.',
      severity: 2, // Error
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const results: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [message1, message2],
        errorCount: 2,
        warningCount: 0,
      }),
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      ViolationCountStub({
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 2,
        details: [
          ViolationDetailStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          }),
          ViolationDetailStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 2,
            column: 20,
            message: 'Unexpected any. Specify a different type.',
          }),
        ],
      }),
    ]);
  });

  it('VALID: {results: [multiple different rules]} => returns correct counts', () => {
    const anyMessage: LintMessage = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const tsIgnoreMessage: LintMessage = LintMessageStub({
      line: 2,
      column: 1,
      message: 'Do not use "@ts-ignore" because it alters compilation errors.',
      severity: 2,
      ruleId: '@typescript-eslint/ban-ts-comment',
    });

    const results: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [anyMessage, tsIgnoreMessage],
        errorCount: 2,
        warningCount: 0,
      }),
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      ViolationCountStub({
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 1,
        details: [
          ViolationDetailStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          }),
        ],
      }),
      ViolationCountStub({
        ruleId: '@typescript-eslint/ban-ts-comment',
        count: 1,
        details: [
          ViolationDetailStub({
            ruleId: '@typescript-eslint/ban-ts-comment',
            line: 2,
            column: 1,
            message: 'Do not use "@ts-ignore" because it alters compilation errors.',
          }),
        ],
      }),
    ]);
  });

  it('VALID: {results: [warnings ignored, only errors counted]} => returns only errors', () => {
    const errorMessage: LintMessage = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2, // Error
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const warningMessage: LintMessage = LintMessageStub({
      line: 2,
      column: 10,
      message: 'Some warning message.',
      severity: 1, // Warning
      ruleId: 'some-warning-rule',
    });

    const results: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [errorMessage, warningMessage],
        errorCount: 1,
        warningCount: 1,
      }),
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      ViolationCountStub({
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 1,
        details: [
          ViolationDetailStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          }),
        ],
      }),
    ]);
  });

  it('VALID: {results: [messages without ruleId]} => ignores messages without ruleId', () => {
    const errorWithRuleId: LintMessage = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const errorWithoutRuleId: LintMessage = LintMessageStub({
      line: 2,
      column: 10,
      message: 'Parse error message.',
      severity: 2,
      // No ruleId
    });

    const results: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [errorWithRuleId, errorWithoutRuleId],
        errorCount: 2,
        warningCount: 0,
      }),
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      ViolationCountStub({
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 1,
        details: [
          ViolationDetailStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          }),
        ],
      }),
    ]);
  });
});
