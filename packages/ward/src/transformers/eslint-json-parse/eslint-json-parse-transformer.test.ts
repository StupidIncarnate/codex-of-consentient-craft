import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { eslintJsonParseTransformer } from './eslint-json-parse-transformer';

describe('eslintJsonParseTransformer', () => {
  describe('valid output', () => {
    it('VALID: {single file with one error severity 2} => returns single ErrorEntry with severity error', () => {
      const jsonOutput = JSON.stringify([
        {
          filePath: '/path/file.ts',
          messages: [
            {
              ruleId: 'no-unused-vars',
              severity: 2,
              message: "'x' is unused",
              line: 5,
              column: 3,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const result = eslintJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: '/path/file.ts',
          line: 5,
          column: 3,
          message: "'x' is unused",
          severity: 'error',
          rule: 'no-unused-vars',
        }),
      ]);
    });

    it('VALID: {warning severity 1} => returns ErrorEntry with severity warning', () => {
      const jsonOutput = JSON.stringify([
        {
          filePath: '/path/file.ts',
          messages: [
            {
              ruleId: 'no-console',
              severity: 1,
              message: 'Unexpected console statement',
              line: 10,
              column: 1,
            },
          ],
          errorCount: 0,
          warningCount: 1,
        },
      ]);

      const result = eslintJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: '/path/file.ts',
          line: 10,
          column: 1,
          message: 'Unexpected console statement',
          severity: 'warning',
          rule: 'no-console',
        }),
      ]);
    });

    it('VALID: {multiple files with multiple messages} => returns flattened ErrorEntry array', () => {
      const jsonOutput = JSON.stringify([
        {
          filePath: '/path/a.ts',
          messages: [
            { ruleId: 'no-unused-vars', severity: 2, message: 'Unused var', line: 1, column: 1 },
            { ruleId: 'semi', severity: 1, message: 'Missing semi', line: 2, column: 10 },
          ],
          errorCount: 1,
          warningCount: 1,
        },
        {
          filePath: '/path/b.ts',
          messages: [{ ruleId: 'eqeqeq', severity: 2, message: 'Use ===', line: 3, column: 5 }],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const result = eslintJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: '/path/a.ts',
          line: 1,
          column: 1,
          message: 'Unused var',
          severity: 'error',
          rule: 'no-unused-vars',
        }),
        ErrorEntryStub({
          filePath: '/path/a.ts',
          line: 2,
          column: 10,
          message: 'Missing semi',
          severity: 'warning',
          rule: 'semi',
        }),
        ErrorEntryStub({
          filePath: '/path/b.ts',
          line: 3,
          column: 5,
          message: 'Use ===',
          severity: 'error',
          rule: 'eqeqeq',
        }),
      ]);
    });

    it('VALID: {null ruleId} => returns ErrorEntry without rule field', () => {
      const jsonOutput = JSON.stringify([
        {
          filePath: '/path/file.ts',
          messages: [{ ruleId: null, severity: 2, message: 'Parsing error', line: 1, column: 1 }],
          errorCount: 1,
          warningCount: 0,
        },
      ]);

      const result = eslintJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: '/path/file.ts',
          line: 1,
          column: 1,
          message: 'Parsing error',
          severity: 'error',
        }),
      ]);
    });
  });

  describe('empty output', () => {
    it('EMPTY: {file with no messages} => returns empty array', () => {
      const jsonOutput = JSON.stringify([
        { filePath: '/path/file.ts', messages: [], errorCount: 0, warningCount: 0 },
      ]);

      const result = eslintJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty array} => returns empty array', () => {
      const result = eslintJsonParseTransformer({ jsonOutput: '[]' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid input', () => {
    it('EDGE: {non-array JSON} => returns empty array', () => {
      const result = eslintJsonParseTransformer({ jsonOutput: '{}' });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {file result missing messages} => skips that file', () => {
      const jsonOutput = JSON.stringify([{ filePath: '/path/file.ts' }]);

      const result = eslintJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {non-JSON string} => throws SyntaxError', () => {
      expect(() =>
        eslintJsonParseTransformer({ jsonOutput: 'Oops! Something went wrong!' }),
      ).toThrow(SyntaxError);
    });

    it('EDGE: {ESLint output with text before JSON array} => extracts and parses correctly', () => {
      const jsonOutput = `Deprecation warning: something\n${JSON.stringify([
        {
          filePath: '/path/file.ts',
          messages: [
            {
              ruleId: 'no-unused-vars',
              severity: 2,
              message: 'Unused var',
              line: 1,
              column: 1,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ])}`;

      const result = eslintJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        ErrorEntryStub({
          filePath: '/path/file.ts',
          line: 1,
          column: 1,
          message: 'Unused var',
          severity: 'error',
          rule: 'no-unused-vars',
        }),
      ]);
    });

    it('EDGE: {message missing required fields} => skips that message', () => {
      const jsonOutput = JSON.stringify([
        {
          filePath: '/path/file.ts',
          messages: [{ ruleId: 'test' }],
        },
      ]);

      const result = eslintJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });
  });
});
