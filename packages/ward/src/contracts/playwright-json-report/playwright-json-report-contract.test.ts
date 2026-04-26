import { playwrightJsonReportContract } from './playwright-json-report-contract';
import { PlaywrightJsonReportStub } from './playwright-json-report.stub';

describe('playwrightJsonReportContract', () => {
  describe('valid inputs', () => {
    it('VALID: {full report with nested suites} => parses successfully', () => {
      const result = playwrightJsonReportContract.parse(PlaywrightJsonReportStub());

      expect(result).toStrictEqual({
        suites: [
          {
            title: 'root',
            specs: [
              {
                title: 'renders the dashboard',
                file: 'tests/dashboard.e2e.test.ts',
                tests: [
                  {
                    results: [{ status: 'passed', duration: 200 }],
                  },
                ],
              },
            ],
            suites: [
              {
                title: 'nested',
                specs: [],
              },
            ],
          },
        ],
      });
    });

    it('VALID: {empty object} => parses with no suites', () => {
      const result = playwrightJsonReportContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {extra fields} => parses with passthrough', () => {
      const result = playwrightJsonReportContract.parse({
        config: { ok: true },
        suites: [],
      });

      expect(result).toStrictEqual({
        config: { ok: true },
        suites: [],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {suites: "string"} => throws validation error', () => {
      expect(() =>
        playwrightJsonReportContract.parse({
          suites: 'oops',
        }),
      ).toThrow(/Expected array/u);
    });

    it('INVALID: {suite.specs: 5} => throws validation error', () => {
      expect(() =>
        playwrightJsonReportContract.parse({
          suites: [{ title: 't', specs: 5 }],
        }),
      ).toThrow(/Expected array/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid playwright report', () => {
      const result = PlaywrightJsonReportStub();

      expect(result).toStrictEqual({
        suites: [
          {
            title: 'root',
            specs: [
              {
                title: 'renders the dashboard',
                file: 'tests/dashboard.e2e.test.ts',
                tests: [
                  {
                    results: [{ status: 'passed', duration: 200 }],
                  },
                ],
              },
            ],
            suites: [
              {
                title: 'nested',
                specs: [],
              },
            ],
          },
        ],
      });
    });
  });
});
