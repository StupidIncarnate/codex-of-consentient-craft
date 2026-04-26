import { eslintJsonReportContract } from './eslint-json-report-contract';
import { EslintJsonReportStub } from './eslint-json-report.stub';

describe('eslintJsonReportContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = eslintJsonReportContract.parse(EslintJsonReportStub());

      expect(result).toStrictEqual([
        {
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
        },
      ]);
    });

    it('VALID: {empty array} => parses successfully', () => {
      const result = eslintJsonReportContract.parse([]);

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {object instead of array} => throws validation error', () => {
      expect(() =>
        eslintJsonReportContract.parse({
          filePath: '/x',
        }),
      ).toThrow(/Expected array/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid report with one entry', () => {
      const result = EslintJsonReportStub();

      expect(result).toStrictEqual([
        {
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
        },
      ]);
    });
  });
});
