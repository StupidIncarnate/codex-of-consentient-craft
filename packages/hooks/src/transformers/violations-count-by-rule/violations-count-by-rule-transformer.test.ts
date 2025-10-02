import { violationsCountByRuleTransformer } from './violations-count-by-rule-transformer';
import type { LintMessage, LintResult } from '../../types/lint-type';

describe('violationsCountByRuleTransformer', () => {
  it('VALID: {results: []} => returns empty array', () => {
    const results: LintResult[] = [];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([]);
  });

  it('VALID: {results: [1 any violation]} => returns correct counts', () => {
    const message: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2, // Error
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const results: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [message],
        errorCount: 1,
        warningCount: 0,
      },
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      {
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 1,
        details: [
          {
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          },
        ],
      },
    ]);
  });

  it('VALID: {results: [multiple violations of same rule]} => returns correct counts', () => {
    const message1: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2, // Error
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const message2: LintMessage = {
      line: 2,
      column: 20,
      message: 'Unexpected any. Specify a different type.',
      severity: 2, // Error
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const results: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [message1, message2],
        errorCount: 2,
        warningCount: 0,
      },
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      {
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 2,
        details: [
          {
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          },
          {
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 2,
            column: 20,
            message: 'Unexpected any. Specify a different type.',
          },
        ],
      },
    ]);
  });

  it('VALID: {results: [multiple different rules]} => returns correct counts', () => {
    const anyMessage: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const tsIgnoreMessage: LintMessage = {
      line: 2,
      column: 1,
      message: 'Do not use "@ts-ignore" because it alters compilation errors.',
      severity: 2,
      ruleId: '@typescript-eslint/ban-ts-comment',
    };

    const results: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [anyMessage, tsIgnoreMessage],
        errorCount: 2,
        warningCount: 0,
      },
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      {
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 1,
        details: [
          {
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          },
        ],
      },
      {
        ruleId: '@typescript-eslint/ban-ts-comment',
        count: 1,
        details: [
          {
            ruleId: '@typescript-eslint/ban-ts-comment',
            line: 2,
            column: 1,
            message: 'Do not use "@ts-ignore" because it alters compilation errors.',
          },
        ],
      },
    ]);
  });

  it('VALID: {results: [warnings ignored, only errors counted]} => returns only errors', () => {
    const errorMessage: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2, // Error
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const warningMessage: LintMessage = {
      line: 2,
      column: 10,
      message: 'Some warning message.',
      severity: 1, // Warning
      ruleId: 'some-warning-rule',
    };

    const results: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [errorMessage, warningMessage],
        errorCount: 1,
        warningCount: 1,
      },
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      {
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 1,
        details: [
          {
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          },
        ],
      },
    ]);
  });

  it('VALID: {results: [messages without ruleId]} => ignores messages without ruleId', () => {
    const errorWithRuleId: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const errorWithoutRuleId: LintMessage = {
      line: 2,
      column: 10,
      message: 'Parse error message.',
      severity: 2,
      // No ruleId
    };

    const results: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [errorWithRuleId, errorWithoutRuleId],
        errorCount: 2,
        warningCount: 0,
      },
    ];

    const counts = violationsCountByRuleTransformer({ results });

    expect(counts).toStrictEqual([
      {
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 1,
        details: [
          {
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 1,
            column: 15,
            message: 'Unexpected any. Specify a different type.',
          },
        ],
      },
    ]);
  });
});
