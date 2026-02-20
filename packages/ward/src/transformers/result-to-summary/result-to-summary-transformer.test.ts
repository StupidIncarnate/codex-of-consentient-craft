import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { WardSummaryStub } from '../../contracts/ward-summary/ward-summary.stub';
import { resultToSummaryTransformer } from './result-to-summary-transformer';

describe('resultToSummaryTransformer', () => {
  describe('empty checks', () => {
    it('VALID: {wardResult: no checks} => returns run line only', () => {
      const wardResult = WardResultStub({ checks: [] });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p' }),
      });

      expect(result).toBe(WardSummaryStub({ value: 'run: 1739625600000-a3f1' }));
    });
  });

  describe('passing checks', () => {
    it('VALID: {wardResult: lint pass with 2 packages} => returns PASS with package and file count', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'pass',
                filesCount: 100,
              }),
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'pass',
                filesCount: 47,
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nlint:      PASS  2 packages (147 files passed/0 files failed)',
        }),
      );
    });
  });

  describe('zero files warning', () => {
    it('VALID: {wardResult: lint pass with 0 files} => returns WARN for zero files', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'pass',
                filesCount: 0,
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p' }),
      });

      expect(result).toBe(
        WardSummaryStub({ value: 'run: 1739625600000-a3f1\nlint:      WARN  0 files run' }),
      );
    });
  });

  describe('failing checks', () => {
    it('VALID: {wardResult: test fail with errors and test failures} => returns FAIL with detail sections', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'fail',
                filesCount: 10,
                testFailures: [
                  TestFailureStub({ testName: 'test1' }),
                  TestFailureStub({ testName: 'test2' }),
                  TestFailureStub({ testName: 'test3' }),
                ],
              }),
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
                filesCount: 10,
                errors: [ErrorEntryStub()],
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p/web' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nunit:      FAIL  2 packages (18 files passed/2 files failed)  web (3), cli (1)\n\n--- unit ---\nsrc/index.test.ts\n  FAIL "test1"\n    Expected true to be false\nsrc/index.test.ts\n  FAIL "test2"\n    Expected true to be false\nsrc/index.test.ts\n  FAIL "test3"\n    Expected true to be false\n/p/cli/src/index.ts\n  Unexpected any (line 10)',
        }),
      );
    });

    it('VALID: {wardResult: lint errors with cwd matching project} => strips project path prefix', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
                filesCount: 10,
                errors: [
                  ErrorEntryStub({
                    filePath: '/p/cli/src/start-install.ts',
                    rule: '@typescript-eslint/no-unsafe-assignment',
                    message: 'Unsafe assignment',
                    line: 55,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p/cli' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nlint:      FAIL  1 packages (9 files passed/1 files failed)  cli (1)\n\n--- lint ---\nsrc/start-install.ts\n  @typescript-eslint/no-unsafe-assignment Unsafe assignment (line 55)',
        }),
      );
    });

    it('VALID: {wardResult: test failures with multiline message} => shows first line only', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
                filesCount: 10,
                testFailures: [
                  TestFailureStub({
                    suitePath: '/p/cli/src/guard.test.ts',
                    testName: 'should return false',
                    message: 'Expected: false\n    at Object.<anonymous> (/path:42:22)',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p/cli' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nunit:      FAIL  1 packages (9 files passed/1 files failed)  cli (1)\n\n--- unit ---\nsrc/guard.test.ts\n  FAIL "should return false"\n    Expected: false',
        }),
      );
    });

    it('VALID: {wardResult: cwd is repo root} => paths include package folder', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/repo/packages/cli' },
                status: 'fail',
                filesCount: 10,
                errors: [
                  ErrorEntryStub({
                    filePath: '/repo/packages/cli/src/file.ts',
                    rule: '@typescript-eslint/no-unused-vars',
                    message: 'Unused var',
                    line: 10,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nlint:      FAIL  1 packages (9 files passed/1 files failed)  cli (1)\n\n--- lint ---\npackages/cli/src/file.ts\n  @typescript-eslint/no-unused-vars Unused var (line 10)',
        }),
      );
    });
  });

  describe('line zero display', () => {
    it('VALID: {error with line=0} => omits line number from detail output', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
                filesCount: 10,
                errors: [
                  ErrorEntryStub({
                    filePath: '/p/cli/src/broken.ts',
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

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p/cli' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nlint:      FAIL  1 packages (9 files passed/1 files failed)  cli (1)\n\n--- lint ---\nsrc/broken.ts\n  Parsing error: Unexpected token',
        }),
      );
    });
  });

  describe('fail edge cases', () => {
    it('VALID: {wardResult: fail status with 0 total files} => shows WARN instead of FAIL for summary line', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'fail',
                filesCount: 0,
                errors: [ErrorEntryStub()],
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p/web' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nlint:      WARN  0 files run\n\n--- lint ---\nsrc/index.ts\n  Unexpected any (line 10)',
        }),
      );
    });

    it('VALID: {wardResult: fail status but no project has errors or failures} => FAIL line shows crash indicator and raw output', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'fail',
                filesCount: 5,
                errors: [],
                testFailures: [],
                rawOutput: { stdout: 'FATAL ERROR: out of memory', stderr: '', exitCode: 1 },
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nunit:      FAIL  1 packages (5 files passed/0 files failed)  web (crash)\n\n--- unit ---\nweb\n  (crash) FATAL ERROR: out of memory',
        }),
      );
    });
  });

  describe('skipped checks', () => {
    it('VALID: {wardResult: test skip with stderr reason} => returns SKIP with reason', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'skip',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'standards', path: '/p/standards' },
                status: 'skip',
                rawOutput: { stdout: '', stderr: 'no jest.config', exitCode: 0 },
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p/standards' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value: 'run: 1739625600000-a3f1\nunit:      SKIP  standards (no jest.config)',
        }),
      );
    });
  });

  describe('skip edge cases', () => {
    it('VALID: {wardResult: test skip with empty stderr} => shows skipped as fallback reason', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'skip',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'standards', path: '/p/standards' },
                status: 'skip',
                rawOutput: { stdout: '', stderr: '', exitCode: 0 },
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p/standards' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value: 'run: 1739625600000-a3f1\nunit:      SKIP  standards (skipped)',
        }),
      );
    });
  });

  describe('multiple check types', () => {
    it('VALID: {wardResult: lint pass + test fail + typecheck pass} => returns all check lines', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'pass',
                filesCount: 10,
              }),
            ],
          }),
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
                testFailures: [TestFailureStub()],
                filesCount: 8,
              }),
            ],
          }),
          CheckResultStub({
            checkType: 'typecheck',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'standards', path: '/p/standards' },
                status: 'pass',
                filesCount: 2,
              }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p/cli' }),
      });

      expect(result).toBe(
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nlint:      PASS  1 packages (10 files passed/0 files failed)\nunit:      FAIL  1 packages (7 files passed/1 files failed)  cli (1)\ntypecheck: PASS  1 packages (2 files passed/0 files failed)\n\n--- unit ---\nsrc/index.test.ts\n  FAIL "should return valid result"\n    Expected true to be false',
        }),
      );
    });
  });
});
