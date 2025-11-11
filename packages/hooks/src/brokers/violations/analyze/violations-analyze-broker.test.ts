import { violationsAnalyzeBroker } from './violations-analyze-broker';
import { violationsAnalyzeBrokerProxy } from './violations-analyze-broker.proxy';
import { LintMessageStub } from '../../../contracts/lint-message/lint-message.stub';
import { LintResultStub } from '../../../contracts/lint-result/lint-result.stub';
import { ViolationCountStub } from '../../../contracts/violation-count/violation-count.stub';
import { ViolationDetailStub } from '../../../contracts/violation-detail/violation-detail.stub';

type LintMessage = ReturnType<typeof LintMessageStub>;
type LintResult = ReturnType<typeof LintResultStub>;

describe('violationsAnalyzeBroker', () => {
  it('VALID: {oldResults: [], newResults: []} => returns no new violations', () => {
    violationsAnalyzeBrokerProxy();
    const oldResults: LintResult[] = [];
    const newResults: LintResult[] = [];

    const result = violationsAnalyzeBroker({ oldResults, newResults });

    expect(result).toStrictEqual({
      hasNewViolations: false,
      newViolations: [],
    });
  });

  it('VALID: {oldResults: [1 any], newResults: [same 1 any]} => returns no new violations', () => {
    violationsAnalyzeBrokerProxy();
    const message = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const oldResults: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [message],
        errorCount: 1,
        warningCount: 0,
      }),
    ];

    const newResults: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [message],
        errorCount: 1,
        warningCount: 0,
      }),
    ];

    const result = violationsAnalyzeBroker({ oldResults, newResults });

    expect(result).toStrictEqual({
      hasNewViolations: false,
      newViolations: [],
    });
  });

  it('INVALID: {oldResults: [], newResults: [1 any]} => returns new violations with message', () => {
    violationsAnalyzeBrokerProxy();
    const message = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const oldResults: LintResult[] = [];

    const newResults: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [message],
        errorCount: 1,
        warningCount: 0,
      }),
    ];

    const result = violationsAnalyzeBroker({ oldResults, newResults });

    expect(result.hasNewViolations).toBe(true);
    expect(result.newViolations).toStrictEqual([
      ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
    ]);
    expect(result.message).toMatch(/🛑 New code quality violations detected:/u);
    expect(result.message).toMatch(/Code Quality Issue: 1 violation/u);
  });

  it('INVALID: {oldResults: [1 any], newResults: [3 any, 1 ts-ignore]} => returns new violations with formatted message', () => {
    violationsAnalyzeBrokerProxy();
    const oldMessage = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const newMessage1: LintMessage = LintMessageStub({
      line: 1,
      column: 15,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const newMessage2: LintMessage = LintMessageStub({
      line: 2,
      column: 20,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const newMessage3: LintMessage = LintMessageStub({
      line: 3,
      column: 25,
      message: 'Unexpected any. Specify a different type.',
      severity: 2,
      ruleId: '@typescript-eslint/no-explicit-any',
    });

    const tsIgnoreMessage: LintMessage = LintMessageStub({
      line: 4,
      column: 1,
      message: 'Do not use "@ts-ignore" because it alters compilation errors.',
      severity: 2,
      ruleId: '@typescript-eslint/ban-ts-comment',
    });

    const oldResults: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [oldMessage],
        errorCount: 1,
        warningCount: 0,
      }),
    ];

    const newResults: LintResult[] = [
      LintResultStub({
        filePath: '/test/file.ts',
        messages: [newMessage1, newMessage2, newMessage3, tsIgnoreMessage],
        errorCount: 4,
        warningCount: 0,
      }),
    ];

    const result = violationsAnalyzeBroker({ oldResults, newResults });

    expect(result.hasNewViolations).toBe(true);
    expect(result.newViolations).toStrictEqual([
      ViolationCountStub({
        ruleId: '@typescript-eslint/no-explicit-any',
        count: 2,
        details: [
          ViolationDetailStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 2,
            column: 20,
            message: 'Unexpected any. Specify a different type.',
          }),
          ViolationDetailStub({
            ruleId: '@typescript-eslint/no-explicit-any',
            line: 3,
            column: 25,
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
            line: 4,
            column: 1,
            message: 'Do not use "@ts-ignore" because it alters compilation errors.',
          }),
        ],
      }),
    ]);
    expect(result.message).toMatch(/🛑 New code quality violations detected:/u);
    expect(result.message).toMatch(/Code Quality Issue: 2 violations/u);
    expect(result.message).toMatch(/Code Quality Issue: 1 violation/u);
  });
});
