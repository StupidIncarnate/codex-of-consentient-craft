import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { jestJsonParseTransformer } from './jest-json-parse-transformer';

describe('jestJsonParseTransformer', () => {
  describe('valid output', () => {
    it('VALID: {single failed test with stack trace} => returns single TestFailure with stackTrace', () => {
      const jsonOutput = JSON.stringify({
        testResults: [
          {
            testFilePath: '/path/file.test.ts',
            testResults: [
              {
                fullName: 'should work',
                status: 'failed',
                failureMessages: ['Error: expected true\n    at Object.<anonymous> (/path:10:5)'],
              },
            ],
          },
        ],
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
      const jsonOutput = JSON.stringify({
        testResults: [
          {
            testFilePath: '/path/file.test.ts',
            testResults: [
              {
                fullName: 'should fail',
                status: 'failed',
                failureMessages: ['Expected true to be false'],
              },
            ],
          },
        ],
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
      const jsonOutput = JSON.stringify({
        testResults: [
          {
            testFilePath: '/path/file.test.ts',
            testResults: [
              { fullName: 'passes', status: 'passed', failureMessages: [] },
              {
                fullName: 'fails',
                status: 'failed',
                failureMessages: ['Assertion error'],
              },
            ],
          },
        ],
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
      const jsonOutput = JSON.stringify({
        testResults: [
          {
            testFilePath: '/path/a.test.ts',
            testResults: [{ fullName: 'test a', status: 'failed', failureMessages: ['Error a'] }],
          },
          {
            testFilePath: '/path/b.test.ts',
            testResults: [{ fullName: 'test b', status: 'failed', failureMessages: ['Error b'] }],
          },
        ],
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

  describe('empty output', () => {
    it('EMPTY: {no test results} => returns empty array', () => {
      const jsonOutput = JSON.stringify({ testResults: [] });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {all tests passed} => returns empty array', () => {
      const jsonOutput = JSON.stringify({
        testResults: [
          {
            testFilePath: '/path/file.test.ts',
            testResults: [{ fullName: 'passes', status: 'passed', failureMessages: [] }],
          },
        ],
      });

      const result = jestJsonParseTransformer({ jsonOutput });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid input', () => {
    it('EDGE: {non-object JSON} => returns empty array', () => {
      const result = jestJsonParseTransformer({ jsonOutput: '"hello"' });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {missing testResults key} => returns empty array', () => {
      const result = jestJsonParseTransformer({ jsonOutput: '{"other": 1}' });

      expect(result).toStrictEqual([]);
    });
  });
});
