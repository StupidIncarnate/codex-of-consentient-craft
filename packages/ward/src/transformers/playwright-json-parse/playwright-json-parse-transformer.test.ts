import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { playwrightJsonParseTransformer } from './playwright-json-parse-transformer';

describe('playwrightJsonParseTransformer', () => {
  describe('valid output', () => {
    it('VALID: {single failed spec with stack} => returns single TestFailure with stackTrace', () => {
      const jsonOutput = JSON.stringify({
        suites: [
          {
            title: 'tests',
            suites: [
              {
                title: 'login',
                specs: [
                  {
                    title: 'should login',
                    tests: [
                      {
                        results: [
                          {
                            status: 'failed',
                            error: {
                              message: 'Expected visible',
                              stack: 'Error: Expected visible\n    at line:5',
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'tests > login',
          testName: 'should login',
          message: 'Expected visible',
          stackTrace: 'Error: Expected visible\n    at line:5',
        }),
      ]);
    });

    it('VALID: {mixed passed and failed} => returns only failed tests', () => {
      const jsonOutput = JSON.stringify({
        suites: [
          {
            title: 'suite',
            specs: [
              {
                title: 'passes',
                tests: [{ results: [{ status: 'passed' }] }],
              },
              {
                title: 'fails',
                tests: [
                  {
                    results: [{ status: 'failed', error: { message: 'Failed assertion' } }],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'suite',
          testName: 'fails',
          message: 'Failed assertion',
        }),
      ]);
    });
  });

  describe('empty output', () => {
    it('EMPTY: {no suites} => returns empty array', () => {
      const result = playwrightJsonParseTransformer({ jsonOutput: '{"suites":[]}' });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {all tests passed} => returns empty array', () => {
      const jsonOutput = JSON.stringify({
        suites: [
          {
            title: 'suite',
            specs: [
              {
                title: 'passes',
                tests: [{ results: [{ status: 'passed' }] }],
              },
            ],
          },
        ],
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid input', () => {
    it('EDGE: {non-object JSON} => returns empty array', () => {
      const result = playwrightJsonParseTransformer({ jsonOutput: '"hello"' });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {missing suites key} => returns empty array', () => {
      const result = playwrightJsonParseTransformer({ jsonOutput: '{"other": 1}' });

      expect(result).toStrictEqual([]);
    });
  });
});
