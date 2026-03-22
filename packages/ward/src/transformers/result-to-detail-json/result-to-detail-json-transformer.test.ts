import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { resultToDetailJsonTransformer } from './result-to-detail-json-transformer';

describe('resultToDetailJsonTransformer', () => {
  describe('empty result', () => {
    it('VALID: {wardResult: no checks} => returns JSON with empty checks array', () => {
      const wardResult = WardResultStub({ checks: [] });

      const result = resultToDetailJsonTransformer({ wardResult });
      const parsed: unknown = JSON.parse(result);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [],
      });
    });
  });

  describe('strips rawOutput', () => {
    it('VALID: {wardResult: passing check with rawOutput} => excludes rawOutput, onlyDiscovered, onlyProcessed', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                status: 'pass',
                rawOutput: { stdout: 'massive output here', stderr: 'stderr stuff', exitCode: 0 },
                onlyDiscovered: ['src/a.ts', 'src/b.ts'],
                onlyProcessed: ['src/c.ts'],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailJsonTransformer({ wardResult });
      const parsed: unknown = JSON.parse(result);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
        ],
      });
    });
  });

  describe('preserves errors', () => {
    it('VALID: {wardResult: lint error} => includes full error details in JSON', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [
                  ErrorEntryStub({
                    filePath: 'src/app.ts',
                    message: 'no-unused-vars',
                    line: 15,
                    column: 3,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailJsonTransformer({ wardResult });
      const parsed: unknown = JSON.parse(result);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'fail',
                errors: [
                  {
                    filePath: 'src/app.ts',
                    line: 15,
                    column: 3,
                    message: 'no-unused-vars',
                    severity: 'error',
                  },
                ],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
        ],
      });
    });
  });

  describe('preserves test failures', () => {
    it('VALID: {wardResult: test failure with stackTrace} => includes testFailure in JSON', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                testFailures: [
                  TestFailureStub({
                    suitePath: 'src/app.test.ts',
                    testName: 'should work',
                    message: 'Expected true to be false',
                    stackTrace: 'at Object.<anonymous> (src/app.test.ts:5:10)',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailJsonTransformer({ wardResult });
      const parsed: unknown = JSON.parse(result);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'fail',
                errors: [],
                testFailures: [
                  {
                    suitePath: 'src/app.test.ts',
                    testName: 'should work',
                    message: 'Expected true to be false',
                    stackTrace: 'at Object.<anonymous> (src/app.test.ts:5:10)',
                  },
                ],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
        ],
      });
    });
  });

  describe('errors and test failures combined', () => {
    it('VALID: {wardResult: project with errors and testFailures} => includes both in JSON', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [
                  ErrorEntryStub({
                    filePath: 'src/setup.ts',
                    message: 'type-check failed',
                    line: 1,
                    column: 1,
                  }),
                ],
                testFailures: [
                  TestFailureStub({
                    suitePath: 'src/setup.test.ts',
                    testName: 'it works',
                    message: 'nope',
                    stackTrace: 'at line 2',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailJsonTransformer({ wardResult });
      const parsed: unknown = JSON.parse(result);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'fail',
                errors: [
                  {
                    filePath: 'src/setup.ts',
                    line: 1,
                    column: 1,
                    message: 'type-check failed',
                    severity: 'error',
                  },
                ],
                testFailures: [
                  {
                    suitePath: 'src/setup.test.ts',
                    testName: 'it works',
                    message: 'nope',
                    stackTrace: 'at line 2',
                  },
                ],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
        ],
      });
    });
  });

  describe('multiple checks', () => {
    it('VALID: {wardResult: lint and unit checks} => includes both checks in JSON', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass' })],
          }),
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                testFailures: [
                  TestFailureStub({
                    suitePath: 'src/foo.test.ts',
                    testName: 'fails',
                    message: 'oops',
                    stackTrace: 'at line 1',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailJsonTransformer({ wardResult });
      const parsed: unknown = JSON.parse(result);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
          {
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'fail',
                errors: [],
                testFailures: [
                  {
                    suitePath: 'src/foo.test.ts',
                    testName: 'fails',
                    message: 'oops',
                    stackTrace: 'at line 1',
                  },
                ],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
        ],
      });
    });
  });

  describe('multiple project results', () => {
    it('VALID: {wardResult: check with two projects} => includes both projects in JSON', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
              }),
              ProjectResultStub({
                projectFolder: { name: 'shared', path: '/home/user/project/packages/shared' },
                status: 'fail',
                errors: [
                  ErrorEntryStub({
                    filePath: 'src/utils.ts',
                    message: 'no-console',
                    line: 3,
                    column: 1,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailJsonTransformer({ wardResult });
      const parsed: unknown = JSON.parse(result);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: 'hooks', path: '/home/user/project/packages/hooks' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 0,
              },
              {
                projectFolder: { name: 'shared', path: '/home/user/project/packages/shared' },
                status: 'fail',
                errors: [
                  {
                    filePath: 'src/utils.ts',
                    line: 3,
                    column: 1,
                    message: 'no-console',
                    severity: 'error',
                  },
                ],
                testFailures: [],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
        ],
      });
    });
  });

  describe('preserves filesCount and discoveredCount', () => {
    it('VALID: {wardResult: project with filesCount and discoveredCount} => includes counts in JSON', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                status: 'pass',
                filesCount: 42,
                discoveredCount: 7,
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailJsonTransformer({ wardResult });
      const parsed: unknown = JSON.parse(result);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                filesCount: 42,
                discoveredCount: 7,
              },
            ],
          },
        ],
      });
    });
  });
});
