import { eslintUtilLintContentWithFiltering } from './eslint-util-lint-content-with-filtering';
import { eslintUtilLintContent } from './eslint-util-lint-content';

jest.mock('./eslint-util-lint-content');

describe('eslintUtilLintContentWithFiltering', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  describe('valid input', () => {
    it('VALID: no errors after filtering => process exits with code 0', async () => {
      const mockProcessExit = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [{ messages: [] }],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('VALID: only typescript-eslint errors => filters out and exits with code 0', async () => {
      const mockProcessExit = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [
              {
                line: 1,
                message: 'TypeScript error',
                severity: 2,
                ruleId: '@typescript-eslint/no-unused-vars',
              },
            ],
          },
        ],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('VALID: errors without ruleId => formats without rule info', async () => {
      const mockProcessExit = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [{ messages: [{ line: 5, message: 'Parsing error', severity: 2 }] }],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 5: Parsing error',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(2);
    });
  });

  describe('error handling', () => {
    it('ERROR: non-typescript errors present => logs errors and exits with code 2', async () => {
      const mockProcessExit = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [{ line: 1, message: 'Missing semicolon', severity: 2, ruleId: 'semi' }],
          },
        ],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 1: Missing semicolon [semi]',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(2);
    });

    it('ERROR: mixed errors with non-typescript => filters typescript but exits for others', async () => {
      const mockProcessExit = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [
              {
                line: 1,
                message: 'TypeScript error',
                severity: 2,
                ruleId: '@typescript-eslint/no-unused-vars',
              },
              { line: 2, message: 'Missing semicolon', severity: 2, ruleId: 'semi' },
            ],
          },
        ],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 2: Missing semicolon [semi]',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(2);
    });

    it("ERROR: error message format includes '[PreToolUse Hook] ESLint found X error(s) in file'", async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [{ line: 1, message: 'Error message', severity: 2, ruleId: 'some-rule' }],
          },
        ],
      });

      const filePath = 'src/example.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in src/example.ts:\n  Line 1: Error message [some-rule]',
      );
    });

    it("ERROR: error details format includes 'Line X: message [ruleId]'", async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [
              { line: 42, message: 'Variable not used', severity: 2, ruleId: 'no-unused-vars' },
            ],
          },
        ],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 42: Variable not used [no-unused-vars]',
      );
    });

    it('ERROR: exactly 10 errors => shows all 10 errors', async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errors = Array.from({ length: 10 }, (_, i) => ({
        line: i + 1,
        message: `Error ${i + 1}`,
        severity: 2 as const,
        ruleId: 'test-rule',
      }));
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [{ messages: errors }],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      const expectedDetails = errors
        .map((_, i) => `  Line ${i + 1}: Error ${i + 1} [test-rule]`)
        .join('\n');
      expect(mockConsoleError).toHaveBeenCalledWith(
        `[PreToolUse Hook] ESLint found 10 error(s) in test.ts:\n${expectedDetails}`,
      );
    });

    it('ERROR: console.error called with complete error summary', async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [{ line: 5, message: 'Test error', severity: 2, ruleId: 'test-rule' }],
          },
        ],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 5: Test error [test-rule]',
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: severity 1 warnings only => exits with code 0', async () => {
      const mockProcessExit = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [
              { line: 1, message: 'Warning message', severity: 1, ruleId: 'some-warning' },
            ],
          },
        ],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('EDGE: more than 10 errors => shows only first 10 in output', async () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errors = Array.from({ length: 15 }, (_, i) => ({
        line: i + 1,
        message: `Error ${i + 1}`,
        severity: 2 as const,
        ruleId: 'test-rule',
      }));
      jest.mocked(eslintUtilLintContent).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [{ messages: errors }],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await eslintUtilLintContentWithFiltering({ filePath, content });

      const expectedDetails = errors
        .slice(0, 10)
        .map((_, i) => `  Line ${i + 1}: Error ${i + 1} [test-rule]`)
        .join('\n');
      expect(mockConsoleError).toHaveBeenCalledWith(
        `[PreToolUse Hook] ESLint found 15 error(s) in test.ts:\n${expectedDetails}`,
      );
    });
  });
});
