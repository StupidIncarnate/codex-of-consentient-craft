import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { FileTimingStub } from '../../contracts/file-timing/file-timing.stub';
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

  describe('useless first line fallback', () => {
    it('VALID: {wardResult: test failure with thrown quote first line} => skips to meaningful line', () => {
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
                    suitePath: '/p/cli/src/flow.integration.test.ts',
                    testName: 'integration test hangs',
                    message:
                      'TIMEOUT: Test killed before reaching any expect() calls.\nThis is NOT a missing assertion — something upstream hung.',
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
            'run: 1739625600000-a3f1\nunit:      FAIL  1 packages (9 files passed/1 files failed)  cli (1)\n\n--- unit ---\nsrc/flow.integration.test.ts\n  FAIL "integration test hangs"\n    TIMEOUT: Test killed before reaching any expect() calls.',
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
    it('VALID: {wardResult: fail status with 0 total files} => shows FAIL for summary line', () => {
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
            'run: 1739625600000-a3f1\nlint:      FAIL  0 files run\n\n--- lint ---\nsrc/index.ts\n  Unexpected any (line 10)',
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
    it('VALID: {wardResult: test skip} => omits skipped check from summary', () => {
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
          value: 'run: 1739625600000-a3f1',
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

  describe('discovery counts', () => {
    it('VALID: {wardResult: lint pass with discoveredCount matching} => includes discovered count', () => {
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
                discoveredCount: 100,
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
            'run: 1739625600000-a3f1\nlint:      PASS  1 packages (100 files passed/0 files failed, 100 discovered)',
        }),
      );
    });

    it('VALID: {wardResult: integration 0 files run but 12 discovered} => shows DISCOVERY MISMATCH', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'integration',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'hooks', path: '/p/hooks' },
                status: 'fail',
                filesCount: 0,
                discoveredCount: 12,
                errors: [],
                testFailures: [],
                rawOutput: { stdout: 'Jest crashed', stderr: '', exitCode: 1 },
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
            'run: 1739625600000-a3f1\nintegration: FAIL  0 files run, 12 discovered  DISCOVERY MISMATCH\n\n--- integration ---\nhooks\n  (crash) Jest crashed',
        }),
      );
    });

    it('VALID: {wardResult: file-scoped pass with subset} => suppresses DISCOVERY MISMATCH', () => {
      const wardResult = WardResultStub({
        filters: { passthrough: ['src/brokers/quest/orchestration-loop'] },
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'orchestrator', path: '/p/orchestrator' },
                status: 'pass',
                filesCount: 9,
                discoveredCount: 209,
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
            'run: 1739625600000-a3f1\nunit:      PASS  1 packages (9 files passed/0 files failed, 209 discovered)',
        }),
      );
    });

    it('VALID: {wardResult: file-scoped fail with subset} => suppresses DISCOVERY MISMATCH', () => {
      const wardResult = WardResultStub({
        filters: { passthrough: ['src/brokers/quest/orchestration-loop'] },
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'orchestrator', path: '/p/orchestrator' },
                status: 'fail',
                filesCount: 9,
                discoveredCount: 209,
                testFailures: [TestFailureStub({ testName: 'broken test' })],
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
            'run: 1739625600000-a3f1\nunit:      FAIL  1 packages (8 files passed/1 files failed, 209 discovered)  orchestrator (1)\n\n--- unit ---\norchestrator/src/index.test.ts\n  FAIL "broken test"\n    Expected true to be false',
        }),
      );
    });

    it('VALID: {wardResult: file-scoped 0 files run bad path} => shows DISCOVERY MISMATCH', () => {
      const wardResult = WardResultStub({
        filters: { passthrough: ['src/brokers/quest/nonexistent'] },
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'orchestrator', path: '/p/orchestrator' },
                status: 'fail',
                filesCount: 0,
                discoveredCount: 209,
                errors: [],
                testFailures: [],
                rawOutput: { stdout: 'No tests found', stderr: '', exitCode: 1 },
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
            'run: 1739625600000-a3f1\nunit:      FAIL  0 files run, 209 discovered  DISCOVERY MISMATCH\n\n--- unit ---\norchestrator\n  (crash) No tests found',
        }),
      );
    });

    it('VALID: {wardResult: no passthrough with mismatch} => still shows DISCOVERY MISMATCH', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'pass',
                filesCount: 5,
                discoveredCount: 10,
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
            'run: 1739625600000-a3f1\nunit:      PASS  1 packages (5 files passed/0 files failed, 10 discovered)  DISCOVERY MISMATCH',
        }),
      );
    });

    it('VALID: {wardResult: lint mismatch with diff files} => shows diff file paths after DISCOVERY MISMATCH', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'hooks', path: '/p/hooks' },
                status: 'pass',
                filesCount: 286,
                discoveredCount: 285,
                onlyProcessed: ['@types/error-cause.d.ts'],
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
            'run: 1739625600000-a3f1\nlint:      PASS  1 packages (286 files passed/0 files failed, 285 discovered)  DISCOVERY MISMATCH\n  only processed: @types/error-cause.d.ts',
        }),
      );
    });
  });

  describe('check duration display', () => {
    it('VALID: {wardResult: lint pass with durationMs} => appends duration to check line', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            durationMs: 4200,
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'pass',
                filesCount: 147,
              }),
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
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
        WardSummaryStub({
          value:
            'run: 1739625600000-a3f1\nlint:      PASS  2 packages (147 files passed/0 files failed)  4.2s',
        }),
      );
    });

    it('EDGE: {wardResult: lint pass with durationMs=0} => no duration shown (backward compat)', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            durationMs: 0,
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'pass',
                filesCount: 10,
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
            'run: 1739625600000-a3f1\nlint:      PASS  1 packages (10 files passed/0 files failed)',
        }),
      );
    });

    it('VALID: {wardResult: unit fail with durationMs} => appends duration to fail line', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            durationMs: 12300,
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'fail',
                filesCount: 9,
                testFailures: [TestFailureStub({ testName: 'broken' })],
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
            'run: 1739625600000-a3f1\nunit:      FAIL  1 packages (8 files passed/1 files failed)  cli (1)  12.3s\n\n--- unit ---\ncli/src/index.test.ts\n  FAIL "broken"\n    Expected true to be false',
        }),
      );
    });
  });

  describe('total run duration display', () => {
    it('VALID: {wardResult: durationMs > 0} => appends total duration to run line', () => {
      const wardResult = WardResultStub({
        durationMs: 23400,
        checks: [],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p' }),
      });

      expect(result).toBe(WardSummaryStub({ value: 'run: 1739625600000-a3f1  (23.4s)' }));
    });

    it('EDGE: {wardResult: durationMs=0} => no duration on run line (backward compat)', () => {
      const wardResult = WardResultStub({
        durationMs: 0,
        checks: [],
      });

      const result = resultToSummaryTransformer({
        wardResult,
        cwd: AbsoluteFilePathStub({ value: '/p' }),
      });

      expect(result).toBe(WardSummaryStub({ value: 'run: 1739625600000-a3f1' }));
    });
  });

  describe('slow file warnings', () => {
    it('VALID: {wardResult: fileTimings exceeding threshold} => shows slow files section', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'orchestrator', path: '/p/orchestrator' },
                status: 'pass',
                filesCount: 10,
                fileTimings: [
                  FileTimingStub({ filePath: 'src/fast-file.test.ts', durationMs: 200 }),
                  FileTimingStub({
                    filePath: 'src/slow-flow.integration.test.ts',
                    durationMs: 8300,
                  }),
                  FileTimingStub({ filePath: 'src/slow-widget.test.tsx', durationMs: 5200 }),
                ],
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
            'run: 1739625600000-a3f1\nunit:      PASS  1 packages (10 files passed/0 files failed)\n\n--- slow files (unit) ---\n  src/slow-flow.integration.test.ts  8.3s\n  src/slow-widget.test.tsx  5.2s',
        }),
      );
    });

    it('EDGE: {wardResult: all fileTimings below threshold} => no slow files section', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'pass',
                filesCount: 5,
                fileTimings: [
                  FileTimingStub({ filePath: 'src/fast.test.ts', durationMs: 150 }),
                  FileTimingStub({ filePath: 'src/ok.test.ts', durationMs: 4999 }),
                ],
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
            'run: 1739625600000-a3f1\nunit:      PASS  1 packages (5 files passed/0 files failed)',
        }),
      );
    });

    it('VALID: {wardResult: slow files across multiple projects} => aggregates and sorts slowest first', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'web', path: '/p/web' },
                status: 'pass',
                filesCount: 5,
                fileTimings: [
                  FileTimingStub({ filePath: 'src/widget.test.tsx', durationMs: 6000 }),
                ],
              }),
              ProjectResultStub({
                projectFolder: { name: 'cli', path: '/p/cli' },
                status: 'pass',
                filesCount: 3,
                fileTimings: [FileTimingStub({ filePath: 'src/broker.test.ts', durationMs: 9000 })],
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
            'run: 1739625600000-a3f1\nunit:      PASS  2 packages (8 files passed/0 files failed)\n\n--- slow files (unit) ---\n  src/broker.test.ts  9.0s\n  src/widget.test.tsx  6.0s',
        }),
      );
    });
  });
});
