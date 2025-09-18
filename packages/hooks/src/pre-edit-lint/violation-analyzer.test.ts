import { ViolationAnalyzer } from './violation-analyzer';
import type { LintResult, LintMessage, ViolationCount } from '../types/lint-type';
import { ViolationCountStub } from '../../test/stubs/violation.stub';

describe('ViolationAnalyzer', () => {
  describe('countViolationsByRule()', () => {
    it('VALID: {results: []} => returns empty array', () => {
      const results: LintResult[] = [];

      const counts = ViolationAnalyzer.countViolationsByRule({ results });

      expect(counts).toStrictEqual([]);
    });

    it('VALID: {results: [1 any violation]} => returns correct counts', () => {
      const message: LintMessage = {
        line: 1,
        column: 15,
        message: 'Unexpected any. Specify a different type.',
        severity: 2, // error
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

      const counts = ViolationAnalyzer.countViolationsByRule({ results });

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
        severity: 2, // error
        ruleId: '@typescript-eslint/no-explicit-any',
      };

      const message2: LintMessage = {
        line: 2,
        column: 20,
        message: 'Unexpected any. Specify a different type.',
        severity: 2, // error
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

      const counts = ViolationAnalyzer.countViolationsByRule({ results });

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

      const counts = ViolationAnalyzer.countViolationsByRule({ results });

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
        severity: 2, // error
        ruleId: '@typescript-eslint/no-explicit-any',
      };

      const warningMessage: LintMessage = {
        line: 2,
        column: 10,
        message: 'Some warning message.',
        severity: 1, // warning
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

      const counts = ViolationAnalyzer.countViolationsByRule({ results });

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
        // no ruleId
      };

      const results: LintResult[] = [
        {
          filePath: '/test/file.ts',
          messages: [errorWithRuleId, errorWithoutRuleId],
          errorCount: 2,
          warningCount: 0,
        },
      ];

      const counts = ViolationAnalyzer.countViolationsByRule({ results });

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

  describe('findNewViolations()', () => {
    describe('success cases', () => {
      it('VALID: {oldViolations: [], newViolations: []} => returns no new violations', () => {
        const oldViolations: ViolationCount[] = [];
        const newViolations: ViolationCount[] = [];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([]);
      });

      it('VALID: {oldViolations: [1 any], newViolations: [same 1 any]} => returns no new violations', () => {
        const oldViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ];

        const newViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([]);
      });

      it('VALID: {oldViolations: [2 any], newViolations: [1 any]} => returns no new violations (removing violations)', () => {
        const oldViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
        ];

        const newViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([]);
      });

      it('VALID: {oldViolations: [mixed], newViolations: [same counts]} => returns no new violations', () => {
        const oldViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
          ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
        ];

        const newViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
          ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
        ];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([]);
      });
    });

    describe('failure cases', () => {
      it('INVALID: {oldViolations: [], newViolations: [1 any]} => returns new violations', () => {
        const oldViolations: ViolationCount[] = [];

        const newViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ]);
      });

      it('INVALID: {oldViolations: [1 any], newViolations: [2 any]} => returns 1 new violation', () => {
        const oldViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ];

        const newViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
        ];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ]);
      });

      it('INVALID: {oldViolations: [1 any], newViolations: [1 ts-ignore]} => returns new violations (different rule)', () => {
        const oldViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ];

        const newViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
        ];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([
          ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
        ]);
      });

      it('INVALID: {oldViolations: [], newViolations: [multiple violations]} => returns all as new violations', () => {
        const oldViolations: ViolationCount[] = [];

        const newViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
          ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
          ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 1 }),
        ];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
          ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }),
          ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 1 }),
        ]);
      });

      it('COMPLEX: {oldViolations: [mixed], newViolations: [some removed, some added]} => returns only new violations', () => {
        const oldViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
          ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 2 }),
        ];

        const newViolations: ViolationCount[] = [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 3 }), // +2 new
          ViolationCountStub({ ruleId: '@typescript-eslint/ban-ts-comment', count: 1 }), // -1 (removed, no new)
          ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 1 }), // +1 new rule
        ];

        const result = ViolationAnalyzer.findNewViolations({ oldViolations, newViolations });

        expect(result).toStrictEqual([
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 2 }),
          ViolationCountStub({ ruleId: 'eslint-comments/no-use', count: 1 }),
        ]);
      });
    });
  });

  describe('hasNewViolations()', () => {
    it('VALID: {oldResults: [], newResults: []} => returns no new violations', () => {
      const oldResults: LintResult[] = [];
      const newResults: LintResult[] = [];

      const result = ViolationAnalyzer.hasNewViolations({ oldResults, newResults });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
        message: undefined,
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

      const result = ViolationAnalyzer.hasNewViolations({ oldResults, newResults });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
        message: undefined,
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

      const result = ViolationAnalyzer.hasNewViolations({ oldResults, newResults });

      expect(result).toStrictEqual({
        hasNewViolations: true,
        newViolations: [
          ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
        ],
        message: expect.stringContaining('🛑 New code quality violations detected:'),
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

      const result = ViolationAnalyzer.hasNewViolations({ oldResults, newResults });

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
        message: expect.stringContaining('🛑 New code quality violations detected:'),
      });

      expect(result.message).toContain('Code Quality Issue: 2 violations');
      expect(result.message).toContain('Code Quality Issue: 1 violation');
    });
  });

  describe('formatViolationMessage()', () => {
    it('VALID: {violations: []} => returns basic message', () => {
      const violations: ViolationCount[] = [];

      const message = ViolationAnalyzer.formatViolationMessage({ violations });

      expect(message).toBe(`🛑 New code quality violations detected:

These rules help maintain code quality and safety. Please fix the violations.`);
    });

    it('VALID: {violations: [1 any]} => returns formatted message', () => {
      const violations: ViolationCount[] = [
        ViolationCountStub({ ruleId: '@typescript-eslint/no-explicit-any', count: 1 }),
      ];

      const message = ViolationAnalyzer.formatViolationMessage({ violations });

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

      const message = ViolationAnalyzer.formatViolationMessage({ violations });

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
});
