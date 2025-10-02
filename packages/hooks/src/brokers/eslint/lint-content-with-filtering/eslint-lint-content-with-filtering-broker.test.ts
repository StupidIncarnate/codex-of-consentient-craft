import { eslintLintContentWithFilteringBroker } from './eslint-lint-content-with-filtering-broker';
import { eslintLintContentBroker } from '../lint-content/eslint-lint-content-broker';

jest.mock('../lint-content/eslint-lint-content-broker');

describe('eslintLintContentWithFilteringBroker', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation((): never => {
      throw new Error('process.exit called');
    });
  });

  describe('valid input', () => {
    it('VALID: no errors after filtering => process exits with code 0', async () => {
      const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [{ messages: [] }],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('VALID: only typescript-eslint errors => filters out and exits with code 0', async () => {
      const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
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

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('VALID: errors without ruleId => formats without rule info', async () => {
      const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [{ messages: [{ line: 5, message: 'Parsing error', severity: 2 }] }],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockStderrWrite).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 5: Parsing error\n',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(2);
    });
  });

  describe('error handling', () => {
    it('ERROR: non-typescript errors present => logs errors and exits with code 2', async () => {
      const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [{ line: 1, message: 'Missing semicolon', severity: 2, ruleId: 'semi' }],
          },
        ],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockStderrWrite).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 1: Missing semicolon [semi]\n',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(2);
    });

    it('ERROR: mixed errors with non-typescript => filters typescript but exits for others', async () => {
      const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
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

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockStderrWrite).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 2: Missing semicolon [semi]\n',
      );
      expect(mockProcessExit).toHaveBeenCalledWith(2);
    });

    it("ERROR: error message format includes '[PreToolUse Hook] ESLint found X error(s) in file'", async () => {
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [{ line: 1, message: 'Error message', severity: 2, ruleId: 'some-rule' }],
          },
        ],
      });

      const filePath = 'src/example.ts';
      const content = 'const x = 1;';

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockStderrWrite).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in src/example.ts:\n  Line 1: Error message [some-rule]\n',
      );
    });

    it("ERROR: error details format includes 'Line X: message [ruleId]'", async () => {
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
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

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockStderrWrite).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 42: Variable not used [no-unused-vars]\n',
      );
    });

    it('ERROR: exactly 10 errors => shows all 10 errors', async () => {
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });
      const errorCount = 10;
      const errors = [];
      for (let index = 0; index < errorCount; index += 1) {
        errors.push({
          line: index + 1,
          message: `Error ${index + 1}`,
          severity: 2 as const,
          ruleId: 'test-rule',
        });
      }
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [{ messages: errors }],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      const expectedDetails = errors
        .map((error) => {
          return `  Line ${error.line}: ${error.message} [${error.ruleId}]`;
        })
        .join('\n');
      expect(mockStderrWrite).toHaveBeenCalledWith(
        `[PreToolUse Hook] ESLint found 10 error(s) in test.ts:\n${expectedDetails}\n`,
      );
    });

    it('ERROR: process.stderr.write called with complete error summary', async () => {
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [
          {
            messages: [{ line: 5, message: 'Test error', severity: 2, ruleId: 'test-rule' }],
          },
        ],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockStderrWrite).toHaveBeenCalledTimes(1);
      expect(mockStderrWrite).toHaveBeenCalledWith(
        '[PreToolUse Hook] ESLint found 1 error(s) in test.ts:\n  Line 5: Test error [test-rule]\n',
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: severity 1 warnings only => exits with code 0', async () => {
      const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((): never => {
        throw new Error('process.exit called');
      });
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
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

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('EDGE: more than 10 errors => shows only first 10 in output', async () => {
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {
        return true;
      });
      const errorCount = 15;
      const errors = [];
      for (let index = 0; index < errorCount; index += 1) {
        errors.push({
          line: index + 1,
          message: `Error ${index + 1}`,
          severity: 2 as const,
          ruleId: 'test-rule',
        });
      }
      jest.mocked(eslintLintContentBroker).mockResolvedValue({
        fixedContent: 'const x = 1;',
        fixResults: [{ messages: errors }],
      });

      const filePath = 'test.ts';
      const content = 'const x = 1;';

      await expect(eslintLintContentWithFilteringBroker({ filePath, content })).rejects.toThrow(
        'process.exit called',
      );

      const maxErrors = 10;
      const expectedDetails = errors
        .slice(0, maxErrors)
        .map((error) => {
          return `  Line ${error.line}: ${error.message} [${error.ruleId}]`;
        })
        .join('\n');
      expect(mockStderrWrite).toHaveBeenCalledWith(
        `[PreToolUse Hook] ESLint found 15 error(s) in test.ts:\n${expectedDetails}\n`,
      );
    });
  });
});
