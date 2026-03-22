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
});
