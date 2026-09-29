import { eslintRawReportContract } from './eslint-raw-report-contract';
import { EslintRawReportStub } from './eslint-raw-report.stub';

describe('eslintRawReportContract', () => {
  describe('valid inputs', () => {
    it('VALID: {default stub} => keeps every key of the entry', () => {
      expect(EslintRawReportStub()).toStrictEqual([{ filePath: 'a.ts', messages: [], stats: {} }]);
    });

    it('EMPTY: {[]} => returns an empty array', () => {
      expect(eslintRawReportContract.parse([])).toStrictEqual([]);
    });
  });

  describe('invalid inputs', () => {
    it('VALID: {a non-object entry beside an object} => keeps both', () => {
      expect(eslintRawReportContract.parse([7, { filePath: 'a.ts' }])).toStrictEqual([
        7,
        { filePath: 'a.ts' },
      ]);
    });

    it('INVALID: {an object} => safeParse fails', () => {
      expect(eslintRawReportContract.safeParse({}).success).toBe(false);
    });
  });
});
