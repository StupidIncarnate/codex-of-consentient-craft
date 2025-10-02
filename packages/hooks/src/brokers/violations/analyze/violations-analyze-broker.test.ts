import { violationsAnalyzeBroker } from './violations-analyze-broker';
import type { LintMessage, LintResult } from '../../../types/lint-type';
import { ViolationCountStub } from '../../../../test/stubs/violation.stub';

describe('violationsAnalyzeBroker', () => {
  it('VALID: {oldResults: [], newResults: []} => returns no new violations', () => {
    const oldResults: LintResult[] = [];
    const newResults: LintResult[] = [];

    const result = violationsAnalyzeBroker({ oldResults, newResults });

    expect(result).toStrictEqual({
      hasNewViolations: false,
      newViolations: [],
    });
  });

  it('VALID: {oldResults: [1 any], newResults: [same 1 any]} => returns no new violations', () => {
    const message: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const oldResults: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [message],
        errorCount: 1,
        warningCount: 0,
      },
    ];

    const newResults: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [message],
        errorCount: 1,
        warningCount: 0,
      },
    ];

    const result = violationsAnalyzeBroker({ oldResults, newResults });

    expect(result).toStrictEqual({
      hasNewViolations: false,
      newViolations: [],
    });
  });

  it('INVALID: {oldResults: [], newResults: [1 any]} => returns new violations with message', () => {
    const message: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const oldResults: LintResult[] = [];

    const newResults: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [message],
        errorCount: 1,
        warningCount: 0,
      },
    ];

    const result = violationsAnalyzeBroker({ oldResults, newResults });

    expect(result).toStrictEqual({
      hasNewViolations: true,
      newViolations: [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ],
      message: expect.stringMatching(/🛑 New code quality violations detected:/u),
    });

    expect(result.message).toContain('Code Quality Issue: 1 violation');
  });

  it('INVALID: {oldResults: [1 any], newResults: [3 any, 1 ts-ignore]} => returns new violations with formatted message', () => {
    const oldMessage: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const newMessage1: LintMessage = {
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const newMessage2: LintMessage = {
      line: 2,
      column: 20,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const newMessage3: LintMessage = {
      line: 3,
      column: 25,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    };

    const tsIgnoreMessage: LintMessage = {
      line: 4,
      column: 1,
      message: 'Do not use "@ts-ignore" because it alters compilation errors.',
      severity: 2,
      ruleId: '@typescript-eslint/ban-ts-comment',
    };

    const oldResults: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [oldMessage],
        errorCount: 1,
        warningCount: 0,
      },
    ];

    const newResults: LintResult[] = [
      {
        filePath: '/test/file.ts',
        messages: [newMessage1, newMessage2, newMessage3, tsIgnoreMessage],
        errorCount: 4,
        warningCount: 0,
      },
    ];

    const result = violationsAnalyzeBroker({ oldResults, newResults });

    expect(result).toStrictEqual({
      hasNewViolations: true,
      newViolations: [
        ViolationCountStub({
          ruleId: '@typescript-eslint/no-explicit-any',
          count: 2,
          details: [
            {
              ruleId: '@typescript-eslint/no-explicit-any',
              line: 2,
              column: 20,
              message: 'Unexpected any. Specify a different type.',
            },
            {
              ruleId: '@typescript-eslint/no-explicit-any',
              line: 3,
              column: 25,
              message: 'Unexpected any. Specify a different type.',
            },
          ],
        }),
        ViolationCountStub({
          ruleId: '@typescript-eslint/ban-ts-comment',
          count: 1,
          details: [
            {
              ruleId: '@typescript-eslint/ban-ts-comment',
              line: 4,
              column: 1,
              message: 'Do not use "@ts-ignore" because it alters compilation errors.',
            },
          ],
        }),
      ],
      message: expect.stringMatching(/🛑 New code quality violations detected:/u),
    });

    expect(result.message).toContain('Code Quality Issue: 2 violations');
    expect(result.message).toContain('Code Quality Issue: 1 violation');
  });
});
