import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { PlaywrightSuiteStub } from '../../contracts/playwright-suite/playwright-suite.stub';
import { PlaywrightSpecStub } from '../../contracts/playwright-spec/playwright-spec.stub';
import { PlaywrightTestResultStub } from '../../contracts/playwright-test-result/playwright-test-result.stub';
import { playwrightSuiteWalkTransformer } from './playwright-suite-walk-transformer';

describe('playwrightSuiteWalkTransformer', () => {
  describe('valid suite', () => {
    it('VALID: {suite with single failed spec} => returns single TestFailure', () => {
      const suite = PlaywrightSuiteStub({
        title: 'login',
        specs: [
          PlaywrightSpecStub({
            title: 'should login',
            tests: [
              {
                results: [
                  PlaywrightTestResultStub({
                    status: 'failed',
                    error: {
                      message: 'Expected visible',
                      stack: 'Error: Expected visible\n    at line:5',
                    },
                  }),
                ],
              },
            ],
          }),
        ],
      });

      const result = playwrightSuiteWalkTransformer({ suite, parentPath: '' });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'login',
          testName: 'should login',
          message: 'Expected visible',
          stackTrace: 'Error: Expected visible\n    at line:5',
        }),
      ]);
    });

    it('VALID: {suite with parentPath} => prepends parentPath to suitePath', () => {
      const suite = PlaywrightSuiteStub({
        title: 'login',
        specs: [
          PlaywrightSpecStub({
            title: 'should login',
            tests: [
              {
                results: [
                  PlaywrightTestResultStub({ status: 'failed', error: { message: 'Timeout' } }),
                ],
              },
            ],
          }),
        ],
      });

      const result = playwrightSuiteWalkTransformer({ suite, parentPath: 'tests' });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'tests > login',
          testName: 'should login',
          message: 'Timeout',
        }),
      ]);
    });

    it('VALID: {nested child suites} => walks recursively and builds full path', () => {
      const suite = PlaywrightSuiteStub({
        title: 'root',
        specs: [],
        suites: [
          PlaywrightSuiteStub({
            title: 'level1',
            specs: [],
            suites: [
              PlaywrightSuiteStub({
                title: 'level2',
                specs: [
                  PlaywrightSpecStub({
                    title: 'deep test',
                    tests: [
                      {
                        results: [
                          PlaywrightTestResultStub({
                            status: 'failed',
                            error: { message: 'Deep failure' },
                          }),
                        ],
                      },
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = playwrightSuiteWalkTransformer({ suite, parentPath: '' });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'root > level1 > level2',
          testName: 'deep test',
          message: 'Deep failure',
        }),
      ]);
    });

    it('VALID: {failed result without error object} => returns Unknown failure message', () => {
      const suite = PlaywrightSuiteStub({
        title: 'suite',
        specs: [
          PlaywrightSpecStub({
            title: 'no error obj',
            tests: [{ results: [{ status: 'failed' }] }],
          }),
        ],
      });

      const result = playwrightSuiteWalkTransformer({ suite, parentPath: '' });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'suite',
          testName: 'no error obj',
          message: 'Unknown failure',
        }),
      ]);
    });

    it('VALID: {error without stack} => returns TestFailure without stackTrace', () => {
      const suite = PlaywrightSuiteStub({
        title: 'suite',
        specs: [
          PlaywrightSpecStub({
            title: 'test',
            tests: [
              {
                results: [
                  PlaywrightTestResultStub({ status: 'failed', error: { message: 'Timeout' } }),
                ],
              },
            ],
          }),
        ],
      });

      const result = playwrightSuiteWalkTransformer({ suite, parentPath: '' });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'suite',
          testName: 'test',
          message: 'Timeout',
        }),
      ]);
    });

    it('VALID: {mixed passed and failed} => returns only failed tests', () => {
      const suite = PlaywrightSuiteStub({
        title: 'suite',
        specs: [
          PlaywrightSpecStub({
            title: 'passes',
            tests: [{ results: [PlaywrightTestResultStub({ status: 'passed' })] }],
          }),
          PlaywrightSpecStub({
            title: 'fails',
            tests: [
              {
                results: [
                  PlaywrightTestResultStub({
                    status: 'failed',
                    error: { message: 'Failed assertion' },
                  }),
                ],
              },
            ],
          }),
        ],
      });

      const result = playwrightSuiteWalkTransformer({ suite, parentPath: '' });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'suite',
          testName: 'fails',
          message: 'Failed assertion',
        }),
      ]);
    });
  });

  describe('empty suite', () => {
    it('EMPTY: {suite with no specs or children} => returns empty array', () => {
      const suite = PlaywrightSuiteStub({ title: 'empty' });

      const result = playwrightSuiteWalkTransformer({ suite, parentPath: '' });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {all tests passed} => returns empty array', () => {
      const suite = PlaywrightSuiteStub({
        title: 'suite',
        specs: [
          PlaywrightSpecStub({
            title: 'passes',
            tests: [{ results: [PlaywrightTestResultStub({ status: 'passed' })] }],
          }),
        ],
      });

      const result = playwrightSuiteWalkTransformer({ suite, parentPath: '' });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid input', () => {
    it('EDGE: {non-object suite} => returns empty array', () => {
      const result = playwrightSuiteWalkTransformer({
        suite: 'not-an-object',
        parentPath: '',
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {suite without title} => returns empty array', () => {
      const result = playwrightSuiteWalkTransformer({ suite: { specs: [] }, parentPath: '' });

      expect(result).toStrictEqual([]);
    });
  });
});
