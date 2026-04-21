import { FileContentsStub } from '@dungeonmaster/shared/contracts';

import { playwrightJsonReportToPassingTransformer } from './playwright-json-report-to-passing-transformer';

describe('playwrightJsonReportToPassingTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {single passing spec with describe trail} => returns one PassingTest with title joined by ›', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'e2e/web/smoke.spec.ts',
              file: 'e2e/web/smoke.spec.ts',
              suites: [
                {
                  title: 'Smoke',
                  specs: [
                    {
                      title: 'loads the page',
                      file: 'e2e/web/smoke.spec.ts',
                      tests: [{ results: [{ status: 'passed', duration: 1234 }] }],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([
        {
          suitePath: 'e2e/web/smoke.spec.ts',
          testName: 'e2e/web/smoke.spec.ts › Smoke › loads the page',
          durationMs: 1234,
        },
      ]);
    });

    it('VALID: {multiple passing specs across suites} => returns entries for each passed spec', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'e2e/web/a.spec.ts',
              specs: [
                {
                  title: 'first',
                  file: 'e2e/web/a.spec.ts',
                  tests: [{ results: [{ status: 'passed', duration: 10 }] }],
                },
              ],
            },
            {
              title: 'e2e/web/b.spec.ts',
              specs: [
                {
                  title: 'second',
                  file: 'e2e/web/b.spec.ts',
                  tests: [{ results: [{ status: 'passed', duration: 20 }] }],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([
        {
          suitePath: 'e2e/web/a.spec.ts',
          testName: 'e2e/web/a.spec.ts › first',
          durationMs: 10,
        },
        {
          suitePath: 'e2e/web/b.spec.ts',
          testName: 'e2e/web/b.spec.ts › second',
          durationMs: 20,
        },
      ]);
    });

    it('VALID: {spec with failed test} => skips failed spec entries', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'mix.spec.ts',
              specs: [
                {
                  title: 'passes',
                  file: 'mix.spec.ts',
                  tests: [{ results: [{ status: 'passed', duration: 1 }] }],
                },
                {
                  title: 'fails',
                  file: 'mix.spec.ts',
                  tests: [{ results: [{ status: 'failed', duration: 2 }] }],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([
        {
          suitePath: 'mix.spec.ts',
          testName: 'mix.spec.ts › passes',
          durationMs: 1,
        },
      ]);
    });

    it('VALID: {test with missing duration} => defaults durationMs to 0', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'a.spec.ts',
              specs: [
                {
                  title: 'no duration',
                  file: 'a.spec.ts',
                  tests: [{ results: [{ status: 'passed' }] }],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([
        {
          suitePath: 'a.spec.ts',
          testName: 'a.spec.ts › no duration',
          durationMs: 0,
        },
      ]);
    });

    it('VALID: {test with multiple result attempts} => uses latest result status', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'a.spec.ts',
              specs: [
                {
                  title: 'retried then passed',
                  file: 'a.spec.ts',
                  tests: [
                    {
                      results: [
                        { status: 'failed', duration: 100 },
                        { status: 'passed', duration: 50 },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([
        {
          suitePath: 'a.spec.ts',
          testName: 'a.spec.ts › retried then passed',
          durationMs: 50,
        },
      ]);
    });
  });

  describe('empty or malformed inputs', () => {
    it('EMPTY: {empty string} => returns empty array', () => {
      const jsonContent = FileContentsStub({ value: '' });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {invalid JSON} => returns empty array', () => {
      const jsonContent = FileContentsStub({ value: 'not json' });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {parsed is null} => returns empty array', () => {
      const jsonContent = FileContentsStub({ value: JSON.stringify(null) });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {suites missing from report} => returns empty array', () => {
      const jsonContent = FileContentsStub({ value: JSON.stringify({ config: {} }) });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty suites array} => returns empty array', () => {
      const jsonContent = FileContentsStub({ value: JSON.stringify({ suites: [] }) });

      const result = playwrightJsonReportToPassingTransformer({ jsonContent });

      expect(result).toStrictEqual([]);
    });
  });
});
