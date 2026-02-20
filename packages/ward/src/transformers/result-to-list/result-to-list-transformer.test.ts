import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { WardErrorListStub } from '../../contracts/ward-error-list/ward-error-list.stub';
import { resultToListTransformer } from './result-to-list-transformer';

describe('resultToListTransformer', () => {
  describe('empty results', () => {
    it('EMPTY: {wardResult: no checks} => returns empty string', () => {
      const wardResult = WardResultStub({ checks: [] });

      const result = resultToListTransformer({ wardResult });

      expect(result).toBe(WardErrorListStub({ value: '' }));
    });

    it('EMPTY: {wardResult: passing check with no errors} => returns empty string', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [ProjectResultStub({ status: 'pass', errors: [], testFailures: [] })],
          }),
        ],
      });

      const result = resultToListTransformer({ wardResult });

      expect(result).toBe(WardErrorListStub({ value: '' }));
    });
  });

  describe('lint errors', () => {
    it('VALID: {wardResult: lint errors in one file} => groups errors under file path', () => {
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
                    line: 15,
                    rule: 'no-unused-vars',
                    message: 'Unused var',
                  }),
                  ErrorEntryStub({
                    filePath: 'src/app.ts',
                    line: 20,
                    rule: '@typescript-eslint/no-explicit-any',
                    message: 'No any',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToListTransformer({ wardResult });

      expect(result).toBe(
        WardErrorListStub({
          value:
            'src/app.ts\n  lint no-unused-vars (line 15)\n  lint @typescript-eslint/no-explicit-any (line 20)',
        }),
      );
    });
  });

  describe('typecheck errors', () => {
    it('VALID: {wardResult: tsc error without rule} => shows checkType without rule', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'typecheck',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [ErrorEntryStub({ filePath: 'src/index.ts', line: 23, message: 'TS2345' })],
              }),
            ],
          }),
        ],
      });

      const result = resultToListTransformer({ wardResult });

      expect(result).toBe(WardErrorListStub({ value: 'src/index.ts\n  typecheck (line 23)' }));
    });
  });

  describe('test failures', () => {
    it('VALID: {wardResult: test failures in one suite} => groups failures under suite path', () => {
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
                    suitePath: 'src/app.test.tsx',
                    testName: 'should render guild list',
                    message: 'Expected true, received false',
                  }),
                  TestFailureStub({
                    suitePath: 'src/app.test.tsx',
                    testName: 'should navigate to quest',
                    message: 'Element not found',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToListTransformer({ wardResult });

      expect(result).toBe(
        WardErrorListStub({
          value:
            'src/app.test.tsx\n  FAIL  "should render guild list" - Expected true, received false\n  FAIL  "should navigate to quest" - Element not found',
        }),
      );
    });
  });

  describe('line zero errors', () => {
    it('VALID: {wardResult: lint error with line=0} => omits line number from output', () => {
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
                    filePath: 'src/broken.ts',
                    line: 0,
                    column: 0,
                    message: 'Parsing error: Unexpected token',
                    severity: 'error',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToListTransformer({ wardResult });

      expect(result).toBe(WardErrorListStub({ value: 'src/broken.ts\n  lint' }));
    });
  });

  describe('mixed errors and failures across files', () => {
    it('VALID: {wardResult: lint + test errors in different files} => groups all by file path', () => {
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
                    line: 15,
                    rule: 'no-unused-vars',
                    message: 'Unused',
                  }),
                ],
              }),
            ],
          }),
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
                    message: 'Failed',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToListTransformer({ wardResult });

      expect(result).toBe(
        WardErrorListStub({
          value:
            'src/app.ts\n  lint no-unused-vars (line 15)\nsrc/app.test.ts\n  FAIL  "should work" - Failed',
        }),
      );
    });
  });
});
