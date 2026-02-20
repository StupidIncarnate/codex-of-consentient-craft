import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { collectPlaywrightFailuresTransformer } from './collect-playwright-failures-transformer';

describe('collectPlaywrightFailuresTransformer', () => {
  describe('empty suites', () => {
    it('EMPTY: {suites: []} => returns empty array', () => {
      const result = collectPlaywrightFailuresTransformer({ suites: [], titlePath: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('failed specs', () => {
    it('VALID: {single failed spec} => returns TestFailure with title path', () => {
      const result = collectPlaywrightFailuresTransformer({
        suites: [
          {
            title: 'login.spec.ts',
            suites: [],
            specs: [
              {
                title: 'should login',
                file: 'e2e/login.spec.ts',
                tests: [
                  {
                    status: 'unexpected',
                    results: [
                      { error: { message: 'Timeout', stack: 'Error: Timeout\n    at line:1' } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        titlePath: [],
      });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/login.spec.ts',
          testName: 'login.spec.ts > should login',
          message: 'Timeout',
          stackTrace: 'Error: Timeout\n    at line:1',
        }),
      ]);
    });
  });

  describe('nested suites', () => {
    it('VALID: {deeply nested suite} => builds full title path', () => {
      const result = collectPlaywrightFailuresTransformer({
        suites: [
          {
            title: 'auth.spec.ts',
            specs: [],
            suites: [
              {
                title: 'login',
                suites: [],
                specs: [
                  {
                    title: 'submits form',
                    file: 'e2e/auth.spec.ts',
                    tests: [
                      {
                        status: 'unexpected',
                        results: [{ error: { message: 'Failed' } }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        titlePath: [],
      });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/auth.spec.ts',
          testName: 'auth.spec.ts > login > submits form',
          message: 'Failed',
        }),
      ]);
    });
  });

  describe('passing specs', () => {
    it('EMPTY: {all expected status} => returns empty array', () => {
      const result = collectPlaywrightFailuresTransformer({
        suites: [
          {
            title: 'pass.spec.ts',
            suites: [],
            specs: [
              {
                title: 'works',
                file: 'e2e/pass.spec.ts',
                tests: [{ status: 'expected', results: [{ status: 'passed' }] }],
              },
            ],
          },
        ],
        titlePath: [],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing error', () => {
    it('VALID: {no error object in result} => returns default message', () => {
      const result = collectPlaywrightFailuresTransformer({
        suites: [
          {
            title: 'crash.spec.ts',
            suites: [],
            specs: [
              {
                title: 'crashes',
                file: 'e2e/crash.spec.ts',
                tests: [{ status: 'unexpected', results: [{}] }],
              },
            ],
          },
        ],
        titlePath: [],
      });

      expect(result).toStrictEqual([
        TestFailureStub({
          suitePath: 'e2e/crash.spec.ts',
          testName: 'crash.spec.ts > crashes',
          message: 'Test failed',
        }),
      ]);
    });
  });
});
