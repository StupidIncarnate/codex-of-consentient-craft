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
    it('VALID: {wardResult: lint pass with 2 packages} => returns PASS with package count', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({ projectFolder: { name: 'web', path: '/p/web' }, status: 'pass' }),
              ProjectResultStub({ projectFolder: { name: 'cli', path: '/p/cli' }, status: 'pass' }),
            ],
          }),
        ],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p' }),
      });

      expect(result).toBe(
        WardSummaryStub({ value: 'run: 1739625600000-a3f1\nlint:      PASS  2 packages' }),
      );
    });
  });

  describe('failing checks', () => {
    it('VALID: {wardResult: test fail with errors and test failures} => returns FAIL with detail sections', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'test',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'fail',
                testFailures: [
                  TestFailureStub({ testName: 'test1' }),
                  TestFailureStub({ testName: 'test2' }),
                  TestFailureStub({ testName: 'test3' }),
                ],
              }),
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
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
            'run: 1739625600000-a3f1\ntest:      FAIL  web (3 failures), cli (1 failures)\n\n--- test ---\nsrc/index.test.ts\n  FAIL "test1"\n    Expected true to be false\nsrc/index.test.ts\n  FAIL "test2"\n    Expected true to be false\nsrc/index.test.ts\n  FAIL "test3"\n    Expected true to be false\n/p/cli/src/index.ts\n  Unexpected any (line 10)',
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
            'run: 1739625600000-a3f1\nlint:      FAIL  cli (1 failures)\n\n--- lint ---\nsrc/start-install.ts\n  @typescript-eslint/no-unsafe-assignment Unsafe assignment (line 55)',
        }),
      );
    });

    it('VALID: {wardResult: test failures with multiline message} => shows first line only', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'test',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
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
            'run: 1739625600000-a3f1\ntest:      FAIL  cli (1 failures)\n\n--- test ---\nsrc/guard.test.ts\n  FAIL "should return false"\n    Expected: false',
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
            'run: 1739625600000-a3f1\nlint:      FAIL  cli (1 failures)\n\n--- lint ---\npackages/cli/src/file.ts\n  @typescript-eslint/no-unused-vars Unused var (line 10)',
        }),
      );
    });
  });

  describe('skipped checks', () => {
    it('VALID: {wardResult: test skip with stderr reason} => returns SKIP with reason', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'test',
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
          value: 'run: 1739625600000-a3f1\ntest:      SKIP  standards (no jest.config)',
        }),
      );
    });
  });

  describe('multiple check types', () => {
    it('VALID: {wardResult: lint pass + test fail + e2e pass} => returns all check lines', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({ projectFolder: { name: 'web', path: '/p/web' }, status: 'pass' }),
            ],
          }),
          CheckResultStub({
            checkType: 'test',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
                testFailures: [TestFailureStub()],
              }),
            ],
          }),
          CheckResultStub({
            checkType: 'e2e',
            status: 'pass',
            projectResults: [
              ProjectResultStub({ projectFolder: { name: 'e2e', path: '/p/e2e' }, status: 'pass' }),
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
            'run: 1739625600000-a3f1\nlint:      PASS  1 packages\ntest:      FAIL  cli (1 failures)\ne2e:       PASS  1 packages\n\n--- test ---\nsrc/index.test.ts\n  FAIL "should return valid result"\n    Expected true to be false',
        }),
      );
    });
  });
});
