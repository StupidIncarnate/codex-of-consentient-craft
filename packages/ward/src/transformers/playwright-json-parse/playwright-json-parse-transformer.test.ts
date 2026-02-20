import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { playwrightJsonParseTransformer } from './playwright-json-parse-transformer';

describe('playwrightJsonParseTransformer', () => {
  describe('valid output', () => {
    it('VALID: {single failed spec} => returns single TestFailure', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'login.spec.ts',
              suites: [],
              specs: [
                {
                  title: 'should display login form',
                  file: 'e2e/login.spec.ts',
                  tests: [
                    {
                      status: 'unexpected',
                      results: [
                        {
                          error: {
                            message: 'Element not found',
                            stack: 'Error: Element not found\n    at test.ts:10:5',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/login.spec.ts',
          testName: 'login.spec.ts > should display login form',
          message: 'Element not found',
          stackTrace: 'Error: Element not found\n    at test.ts:10:5',
        }),
      ]);
    });

    it('VALID: {nested suites} => returns failures with full title path', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'auth.spec.ts',
              suites: [
                {
                  title: 'login flow',
                  suites: [],
                  specs: [
                    {
                      title: 'submits credentials',
                      file: 'e2e/auth.spec.ts',
                      tests: [
                        {
                          status: 'unexpected',
                          results: [{ error: { message: 'Timeout exceeded' } }],
                        },
                      ],
                    },
                  ],
                },
              ],
              specs: [],
            },
          ],
        }),
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/auth.spec.ts',
          testName: 'auth.spec.ts > login flow > submits credentials',
          message: 'Timeout exceeded',
        }),
      ]);
    });

    it('VALID: {multiple failed specs} => returns all failures', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'a.spec.ts',
              suites: [],
              specs: [
                {
                  title: 'test a',
                  file: 'e2e/a.spec.ts',
                  tests: [
                    {
                      status: 'unexpected',
                      results: [{ error: { message: 'Error A' } }],
                    },
                  ],
                },
              ],
            },
            {
              title: 'b.spec.ts',
              suites: [],
              specs: [
                {
                  title: 'test b',
                  file: 'e2e/b.spec.ts',
                  tests: [
                    {
                      status: 'unexpected',
                      results: [{ error: { message: 'Error B' } }],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/a.spec.ts',
          testName: 'a.spec.ts > test a',
          message: 'Error A',
        }),
        TestFailureStub({
          suitePath: 'e2e/b.spec.ts',
          testName: 'b.spec.ts > test b',
          message: 'Error B',
        }),
      ]);
    });
  });

  describe('passing output', () => {
    it('EMPTY: {all tests passed} => returns empty array', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'login.spec.ts',
              suites: [],
              specs: [
                {
                  title: 'should work',
                  file: 'e2e/login.spec.ts',
                  tests: [
                    {
                      status: 'expected',
                      results: [{ status: 'passed' }],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no suites} => returns empty array', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({ suites: [] }),
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });
  });

  describe('crash output', () => {
    it('VALID: {test with no error object} => returns default failure message', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          suites: [
            {
              title: 'crash.spec.ts',
              suites: [],
              specs: [
                {
                  title: 'should not crash',
                  file: 'e2e/crash.spec.ts',
                  tests: [
                    {
                      status: 'unexpected',
                      results: [{}],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = playwrightJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/crash.spec.ts',
          testName: 'crash.spec.ts > should not crash',
          message: 'Test failed',
        }),
      ]);
    });
  });

  describe('invalid input', () => {
    it('EDGE: {non-object JSON} => returns empty array', () => {
      const result = playwrightJsonParseTransformer({
        jsonOutput: ErrorMessageStub({ value: '"hello"' }),
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {missing suites key} => returns empty array', () => {
      const result = playwrightJsonParseTransformer({
        jsonOutput: ErrorMessageStub({ value: '{"other": 1}' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
