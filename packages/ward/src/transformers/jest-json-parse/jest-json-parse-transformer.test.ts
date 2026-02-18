import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { jestJsonParseTransformer } from './jest-json-parse-transformer';

describe('jestJsonParseTransformer', () => {
  describe('valid output', () => {
    it('VALID: {single failed test with stack trace} => returns single TestFailure with stackTrace', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/file.test.ts',
              assertionResults: [
                {
                  fullName: 'should work',
                  status: 'failed',
                  failureMessages: ['Error: expected true\n    at Object.<anonymous> (/path:10:5)'],
                },
              ],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/file.test.ts',
          testName: 'should work',
          message: 'Error: expected true\n    at Object.<anonymous> (/path:10:5)',
          stackTrace: 'Error: expected true\n    at Object.<anonymous> (/path:10:5)',
        }),
      ]);
    });

    it('VALID: {failed test without stack trace} => returns TestFailure without stackTrace', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/file.test.ts',
              assertionResults: [
                {
                  fullName: 'should fail',
                  status: 'failed',
                  failureMessages: ['Expected true to be false'],
                },
              ],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/file.test.ts',
          testName: 'should fail',
          message: 'Expected true to be false',
        }),
      ]);
    });

    it('VALID: {mixed passed and failed tests} => returns only failed tests', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/file.test.ts',
              assertionResults: [
                { fullName: 'passes', status: 'passed', failureMessages: [] },
                {
                  fullName: 'fails',
                  status: 'failed',
                  failureMessages: ['Assertion error'],
                },
              ],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/file.test.ts',
          testName: 'fails',
          message: 'Assertion error',
        }),
      ]);
    });

    it('VALID: {multiple suites with failures} => returns failures from all suites', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/a.test.ts',
              assertionResults: [
                { fullName: 'test a', status: 'failed', failureMessages: ['Error a'] },
              ],
            },
            {
              name: '/path/b.test.ts',
              assertionResults: [
                { fullName: 'test b', status: 'failed', failureMessages: ['Error b'] },
              ],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/a.test.ts',
          testName: 'test a',
          message: 'Error a',
        }),
        TestFailureStub({
          suitePath: '/path/b.test.ts',
          testName: 'test b',
          message: 'Error b',
        }),
      ]);
    });
  });

  describe('suite-level failures', () => {
    it('VALID: {suite failed to run with compilation error} => returns suite-level TestFailure', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/file.test.ts',
              status: 'failed',
              message: 'src/file.ts:10:5 - error TS2552: Cannot find name...',
              assertionResults: [],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/file.test.ts',
          testName: 'Test suite failed to run',
          message: 'src/file.ts:10:5 - error TS2552: Cannot find name...',
        }),
      ]);
    });

    it('VALID: {suite with both assertion failures and suite message} => returns only assertion failures', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/file.test.ts',
              status: 'failed',
              message: 'some suite message',
              assertionResults: [
                {
                  fullName: 'test fails',
                  status: 'failed',
                  failureMessages: ['Assertion error'],
                },
              ],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/file.test.ts',
          testName: 'test fails',
          message: 'Assertion error',
        }),
      ]);
    });

    it('VALID: {suite message with ANSI codes and bullet header} => strips ANSI and skips header', () => {
      const esc = String.fromCharCode(27);
      const suiteMessage = `  \u25cf Test suite failed to run\n\n    ${esc}[96msrc/file.ts${esc}[0m:${esc}[93m33${esc}[0m:${esc}[93m17${esc}[0m - ${esc}[91merror${esc}[0m${esc}[90m TS2552: ${esc}[0mCannot find name 'Foo'.\n\n    ${esc}[7m33${esc}[0m   const x: Foo = 1;`;
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/file.test.ts',
              status: 'failed',
              message: suiteMessage,
              assertionResults: [],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/file.test.ts',
          testName: 'Test suite failed to run',
          message: "src/file.ts:33:17 - error TS2552: Cannot find name 'Foo'.",
        }),
      ]);
    });

    it('VALID: {suite failed with empty message} => returns empty array', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/file.test.ts',
              status: 'failed',
              message: '',
              assertionResults: [],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty output', () => {
    it('EMPTY: {no test results} => returns empty array', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({ testResults: [] }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {all tests passed} => returns empty array', () => {
      const jsonOutput = ErrorMessageStub({
        value: JSON.stringify({
          testResults: [
            {
              name: '/path/file.test.ts',
              assertionResults: [{ fullName: 'passes', status: 'passed', failureMessages: [] }],
            },
          ],
        }),
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });
  });

  describe('mixed output', () => {
    it('VALID: {JSON with trailing stderr text} => extracts JSON and parses failures', () => {
      const json = JSON.stringify({
        testResults: [
          {
            name: '/path/file.test.ts',
            status: 'failed',
            message: '',
            assertionResults: [
              {
                fullName: 'should fail',
                status: 'failed',
                failureMessages: ['Expected true to be false'],
              },
            ],
          },
        ],
      });
      const jsonOutput = ErrorMessageStub({
        value: `${json}FAIL src/file.test.ts\n  Expected true to be false`,
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/file.test.ts',
          testName: 'should fail',
          message: 'Expected true to be false',
        }),
      ]);
    });

    it('VALID: {human-readable text before JSON} => extracts JSON and parses failures', () => {
      const json = JSON.stringify({
        testResults: [
          {
            name: '/path/file.test.ts',
            status: 'failed',
            message: '',
            assertionResults: [
              {
                fullName: 'should fail',
                status: 'failed',
                failureMessages: ['Expected true to be false'],
              },
            ],
          },
        ],
      });
      const jsonOutput = ErrorMessageStub({
        value: `PASS src/other.test.ts\nFAIL src/file.test.ts\n${json}`,
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: '/path/file.test.ts',
          testName: 'should fail',
          message: 'Expected true to be false',
        }),
      ]);
    });
  });

  describe('invalid input', () => {
    it('EDGE: {non-object JSON} => returns empty array', () => {
      const result = jestJsonParseTransformer({
        jsonOutput: ErrorMessageStub({ value: '"hello"' }),
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {missing testResults key} => returns empty array', () => {
      const result = jestJsonParseTransformer({
        jsonOutput: ErrorMessageStub({ value: '{"other": 1}' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
