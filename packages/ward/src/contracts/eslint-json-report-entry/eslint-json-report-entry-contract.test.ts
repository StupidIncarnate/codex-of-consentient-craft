import { eslintJsonReportEntryContract } from './eslint-json-report-entry-contract';
import { EslintJsonReportEntryStub } from './eslint-json-report-entry.stub';

describe('eslintJsonReportEntryContract', () => {
  describe('valid inputs', () => {
    it('VALID: {full entry with messages and stats} => parses successfully', () => {
      const result = eslintJsonReportEntryContract.parse(EslintJsonReportEntryStub());

      expect(result).toStrictEqual({
        filePath: '/repo/packages/example/src/index.ts',
        messages: [
          {
            ruleId: 'no-any',
            severity: 2,
            message: 'Unexpected any',
            line: 10,
            column: 5,
          },
        ],
        stats: {
          times: {
            passes: [{ total: 12.5 }],
          },
        },
      });
    });

    it('VALID: {empty object} => parses with all fields undefined', () => {
      const result = eslintJsonReportEntryContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {extra fields} => parses with passthrough', () => {
      const result = eslintJsonReportEntryContract.parse({
        filePath: '/x/y.ts',
        errorCount: 1,
        warningCount: 0,
      });

      expect(result).toStrictEqual({
        filePath: '/x/y.ts',
        errorCount: 1,
        warningCount: 0,
      });
    });

    it('VALID: {ruleId: null} => parses successfully', () => {
      const result = eslintJsonReportEntryContract.parse({
        messages: [{ ruleId: null, severity: 2, message: 'syntax error' }],
      });

      expect(result).toStrictEqual({
        messages: [{ ruleId: null, severity: 2, message: 'syntax error' }],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {messages: "string"} => throws validation error', () => {
      expect(() =>
        eslintJsonReportEntryContract.parse({
          messages: 'not an array',
        }),
      ).toThrow(/Expected array/u);
    });

    it('INVALID: {filePath: 99} => throws validation error', () => {
      expect(() =>
        eslintJsonReportEntryContract.parse({
          filePath: 99,
        }),
      ).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid entry', () => {
      const result = EslintJsonReportEntryStub();

      expect(result).toStrictEqual({
        filePath: '/repo/packages/example/src/index.ts',
        messages: [
          {
            ruleId: 'no-any',
            severity: 2,
            message: 'Unexpected any',
            line: 10,
            column: 5,
          },
        ],
        stats: {
          times: {
            passes: [{ total: 12.5 }],
          },
        },
      });
    });

    it('VALID: {override filePath} => uses override', () => {
      const result = EslintJsonReportEntryStub({ filePath: '/custom.ts' });

      expect(result).toStrictEqual({
        filePath: '/custom.ts',
        messages: [
          {
            ruleId: 'no-any',
            severity: 2,
            message: 'Unexpected any',
            line: 10,
            column: 5,
          },
        ],
        stats: {
          times: {
            passes: [{ total: 12.5 }],
          },
        },
      });
    });
  });
});
