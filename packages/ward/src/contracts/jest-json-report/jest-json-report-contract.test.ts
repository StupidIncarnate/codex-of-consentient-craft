import { jestJsonReportContract } from './jest-json-report-contract';
import { JestJsonReportStub } from './jest-json-report.stub';

describe('jestJsonReportContract', () => {
  describe('valid inputs', () => {
    it('VALID: {full report with one suite} => parses successfully', () => {
      const result = jestJsonReportContract.parse(JestJsonReportStub());

      expect(result).toStrictEqual({
        numTotalTestSuites: 1,
        numPassedTests: 2,
        testResults: [
          {
            name: '/repo/packages/example/src/foo.test.ts',
            status: 'passed',
            startTime: 1700000000000,
            endTime: 1700000000050,
            assertionResults: [
              {
                status: 'passed',
                fullName: 'foo > does the thing',
                duration: 12,
                failureMessages: [],
              },
            ],
          },
        ],
      });
    });

    it('VALID: {empty object} => parses with all fields undefined', () => {
      const result = jestJsonReportContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {duration: null} => parses successfully', () => {
      const result = jestJsonReportContract.parse({
        testResults: [
          {
            assertionResults: [{ duration: null, status: 'failed' }],
          },
        ],
      });

      expect(result).toStrictEqual({
        testResults: [
          {
            assertionResults: [{ duration: null, status: 'failed' }],
          },
        ],
      });
    });

    it('VALID: {extra fields} => parses with passthrough', () => {
      const result = jestJsonReportContract.parse({
        success: true,
        extraField: 'value',
      });

      expect(result).toStrictEqual({
        success: true,
        extraField: 'value',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {testResults: "string"} => throws validation error', () => {
      expect(() =>
        jestJsonReportContract.parse({
          testResults: 'oops',
        }),
      ).toThrow(/Expected array/u);
    });

    it('INVALID: {numPassedTests: "ten"} => throws validation error', () => {
      expect(() =>
        jestJsonReportContract.parse({
          numPassedTests: 'ten',
        }),
      ).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid jest report', () => {
      const result = JestJsonReportStub();

      expect(result).toStrictEqual({
        numTotalTestSuites: 1,
        numPassedTests: 2,
        testResults: [
          {
            name: '/repo/packages/example/src/foo.test.ts',
            status: 'passed',
            startTime: 1700000000000,
            endTime: 1700000000050,
            assertionResults: [
              {
                status: 'passed',
                fullName: 'foo > does the thing',
                duration: 12,
                failureMessages: [],
              },
            ],
          },
        ],
      });
    });

    it('VALID: {override numPassedTests} => uses override', () => {
      const result = JestJsonReportStub({ numPassedTests: 99 });

      expect(result.numPassedTests).toStrictEqual(99);
    });
  });
});
