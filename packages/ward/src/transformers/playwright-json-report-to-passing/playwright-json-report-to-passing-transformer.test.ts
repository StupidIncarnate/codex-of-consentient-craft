import { FileContentsStub } from '@dungeonmaster/shared/contracts';

import { playwrightJsonReportToPassingTransformer } from './playwright-json-report-to-passing-transformer';

describe('playwrightJsonReportToPassingTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {single passing spec with describe trail} => returns one PassingTest with title joined by ›', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'packages/web/src/flows/app/smoke.e2e.ts',
              file: 'packages/web/src/flows/app/smoke.e2e.ts',
              suites: [
                {
                  title: 'Smoke',
                  specs: [
                    {
                      title: 'loads the page',
                      file: 'packages/web/src/flows/app/smoke.e2e.ts',
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
          suitePath: 'packages/web/src/flows/app/smoke.e2e.ts',
          testName: 'packages/web/src/flows/app/smoke.e2e.ts › Smoke › loads the page',
          durationMs: 1234,
        },
      ]);
    });

    it('VALID: {multiple passing specs across suites} => returns entries for each passed spec', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'packages/web/src/flows/home/a.e2e.ts',
              specs: [
                {
                  title: 'first',
                  file: 'packages/web/src/flows/home/a.e2e.ts',
                  tests: [{ results: [{ status: 'passed', duration: 10 }] }],
                },
              ],
            },
            {
              title: 'packages/web/src/flows/home/b.e2e.ts',
              specs: [
                {
                  title: 'second',
                  file: 'packages/web/src/flows/home/b.e2e.ts',
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
          suitePath: 'packages/web/src/flows/home/a.e2e.ts',
          testName: 'packages/web/src/flows/home/a.e2e.ts › first',
          durationMs: 10,
        },
        {
          suitePath: 'packages/web/src/flows/home/b.e2e.ts',
          testName: 'packages/web/src/flows/home/b.e2e.ts › second',
          durationMs: 20,
        },
      ]);
    });

    it('VALID: {spec with failed test} => skips failed spec entries', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'mix.e2e.ts',
              specs: [
                {
                  title: 'passes',
                  file: 'mix.e2e.ts',
                  tests: [{ results: [{ status: 'passed', duration: 1 }] }],
                },
                {
                  title: 'fails',
                  file: 'mix.e2e.ts',
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
          suitePath: 'mix.e2e.ts',
          testName: 'mix.e2e.ts › passes',
          durationMs: 1,
        },
      ]);
    });

    it('VALID: {test with missing duration} => defaults durationMs to 0', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'a.e2e.ts',
              specs: [
                {
                  title: 'no duration',
                  file: 'a.e2e.ts',
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
          suitePath: 'a.e2e.ts',
          testName: 'a.e2e.ts › no duration',
          durationMs: 0,
        },
      ]);
    });

    it('VALID: {test with multiple result attempts} => uses latest result status', () => {
      const jsonContent = FileContentsStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'a.e2e.ts',
              specs: [
                {
                  title: 'retried then passed',
                  file: 'a.e2e.ts',
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
          suitePath: 'a.e2e.ts',
          testName: 'a.e2e.ts › retried then passed',
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
