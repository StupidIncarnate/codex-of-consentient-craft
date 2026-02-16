import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { WardFileDetailStub } from '../../contracts/ward-file-detail/ward-file-detail.stub';
import { resultToDetailTransformer } from './result-to-detail-transformer';

describe('resultToDetailTransformer', () => {
  describe('no matches', () => {
    it('EMPTY: {wardResult: no checks, filePath: any} => returns file path only', () => {
      const wardResult = WardResultStub({ checks: [] });
      const { filePath } = ErrorEntryStub();

      const result = resultToDetailTransformer({ wardResult, filePath });

      expect(result).toBe(WardFileDetailStub({ value: 'src/index.ts' }));
    });

    it('EMPTY: {wardResult: errors in different file} => returns file path only', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [ErrorEntryStub({ filePath: 'src/other.ts' })],
              }),
            ],
          }),
        ],
      });
      const { filePath } = ErrorEntryStub({ filePath: 'src/target.ts' });

      const result = resultToDetailTransformer({ wardResult, filePath });

      expect(result).toBe(WardFileDetailStub({ value: 'src/target.ts' }));
    });
  });

  describe('lint errors', () => {
    it('VALID: {wardResult: lint error matching filePath} => returns file with error detail', () => {
      const { filePath } = ErrorEntryStub({ filePath: 'src/app.ts' });
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
                    column: 3,
                    rule: 'no-unused-vars',
                    message: 'Unused variable x',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath });

      expect(result).toBe(
        WardFileDetailStub({
          value: 'src/app.ts\n  lint no-unused-vars (line 15, col 3)\n    Unused variable x',
        }),
      );
    });
  });

  describe('typecheck errors', () => {
    it('VALID: {wardResult: tsc error without rule} => shows checkType without rule', () => {
      const { filePath } = ErrorEntryStub({ filePath: 'src/index.ts' });
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'typecheck',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [
                  ErrorEntryStub({
                    filePath: 'src/index.ts',
                    line: 23,
                    column: 10,
                    message: 'TS2345: Argument not assignable',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath });

      expect(result).toBe(
        WardFileDetailStub({
          value: 'src/index.ts\n  typecheck (line 23, col 10)\n    TS2345: Argument not assignable',
        }),
      );
    });
  });

  describe('test failures', () => {
    it('VALID: {wardResult: test failure without stack} => shows failure without stack', () => {
      const { suitePath } = TestFailureStub({ suitePath: 'src/app.test.tsx' });
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'test',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                testFailures: [
                  TestFailureStub({
                    suitePath: 'src/app.test.tsx',
                    testName: 'should render',
                    message: 'Expected true, received false',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath: suitePath });

      expect(result).toBe(
        WardFileDetailStub({
          value: 'src/app.test.tsx\n  FAIL  "should render"\n    Expected true, received false',
        }),
      );
    });

    it('VALID: {wardResult: test failure with stack, verbose: false} => truncates stack trace', () => {
      const lines = Array.from(
        { length: 8 },
        (_, i) => `at line${String(i)} (file.ts:${String(i)}:0)`,
      );
      const fullStack = lines.join('\n');
      const truncatedStack = `${lines.slice(0, 5).join('\n')}\n... (3 more lines, use --verbose for full trace)`;
      const { suitePath } = TestFailureStub({ suitePath: 'src/app.test.tsx' });
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'test',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                testFailures: [
                  TestFailureStub({
                    suitePath: 'src/app.test.tsx',
                    testName: 'should render',
                    message: 'Failed',
                    stackTrace: fullStack,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath: suitePath });

      expect(result).toBe(
        WardFileDetailStub({
          value: `src/app.test.tsx\n  FAIL  "should render"\n    Failed\n    ${truncatedStack}`,
        }),
      );
    });

    it('VALID: {wardResult: test failure with stack, verbose: true} => shows full stack trace', () => {
      const fullStack =
        'at Object.<anonymous> (src/app.test.tsx:10:5)\nat Module._compile (node:internal/modules/cjs/loader:1)';
      const { suitePath } = TestFailureStub({ suitePath: 'src/app.test.tsx' });
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'test',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                testFailures: [
                  TestFailureStub({
                    suitePath: 'src/app.test.tsx',
                    testName: 'should render',
                    message: 'Failed',
                    stackTrace: fullStack,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath: suitePath, verbose: true });

      expect(result).toBe(
        WardFileDetailStub({
          value: `src/app.test.tsx\n  FAIL  "should render"\n    Failed\n    ${fullStack}`,
        }),
      );
    });
  });

  describe('multiple errors in same file', () => {
    it('VALID: {wardResult: lint + test errors for same file} => shows all entries', () => {
      const { filePath } = ErrorEntryStub({ filePath: 'src/app.ts' });
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
                    line: 5,
                    column: 1,
                    rule: 'no-unused-vars',
                    message: 'Unused',
                  }),
                  ErrorEntryStub({
                    filePath: 'src/app.ts',
                    line: 10,
                    column: 2,
                    rule: 'no-any',
                    message: 'No any',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath });

      expect(result).toBe(
        WardFileDetailStub({
          value:
            'src/app.ts\n  lint no-unused-vars (line 5, col 1)\n    Unused\n  lint no-any (line 10, col 2)\n    No any',
        }),
      );
    });
  });
});
