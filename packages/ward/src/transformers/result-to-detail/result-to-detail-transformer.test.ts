import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { PassingTestStub } from '../../contracts/passing-test/passing-test.stub';
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
            checkType: 'unit',
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

    it('VALID: {wardResult: test failure with long message} => shows full message without truncation', () => {
      const lines = Array.from(
        { length: 20 },
        (_, i) => `at line${String(i)} (file.ts:${String(i)}:0)`,
      );
      const fullMessage = lines.join('\n');
      const { suitePath } = TestFailureStub({ suitePath: 'src/app.test.tsx' });
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
                    testName: 'should render',
                    message: fullMessage,
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
          value: `src/app.test.tsx\n  FAIL  "should render"\n    ${fullMessage}`,
        }),
      );
    });

    it('VALID: {wardResult: test failure with framework lines in message} => shows full message including framework lines', () => {
      const message = [
        'Error: expected "wrong" received "ok"',
        '    at Object.<anonymous> (src/app.test.tsx:14:58)',
        '    at Object.toBe (/home/user/project/node_modules/expect/build/index.js:2140:20)',
        '    at callAsyncCircusFn (/home/user/project/node_modules/jest-circus/build/jestAdapterInit.js:1497:10)',
        '    at runTest (/home/user/project/node_modules/jest-runner/build/index.js:343:7)',
      ].join('\n');
      const { suitePath } = TestFailureStub({ suitePath: 'src/app.test.tsx' });
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
                    testName: 'should render',
                    message,
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
          value: `src/app.test.tsx\n  FAIL  "should render"\n    ${message}`,
        }),
      );
    });
  });

  describe('line zero errors', () => {
    it('VALID: {wardResult: lint error with line=0} => omits location from output', () => {
      const { filePath } = ErrorEntryStub({ filePath: 'src/broken.ts' });
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

      const result = resultToDetailTransformer({ wardResult, filePath });

      expect(result).toBe(
        WardFileDetailStub({
          value: 'src/broken.ts\n  lint\n    Parsing error: Unexpected token',
        }),
      );
    });
  });

  describe('path normalization', () => {
    it('VALID: {query: repo-relative path, stored: absolute path} => matches and returns errors', () => {
      const storedPath =
        '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.ts';
      const { filePath: queryPath } = ErrorEntryStub({
        filePath: 'packages/ward/src/guards/is-check-type/is-check-type-guard.ts',
      });
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
                    filePath: storedPath,
                    line: 5,
                    column: 1,
                    rule: 'no-unused-vars',
                    message: 'Unused variable',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath: queryPath });

      expect(result).toBe(
        WardFileDetailStub({
          value: `${String(queryPath)}\n  lint no-unused-vars (line 5, col 1)\n    Unused variable`,
        }),
      );
    });

    it('VALID: {query: package-relative path, stored: absolute path} => matches and returns errors', () => {
      const storedPath =
        '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.ts';
      const { filePath: queryPath } = ErrorEntryStub({
        filePath: 'src/guards/is-check-type/is-check-type-guard.ts',
      });
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
                    filePath: storedPath,
                    line: 10,
                    column: 3,
                    rule: 'no-any',
                    message: 'No any allowed',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath: queryPath });

      expect(result).toBe(
        WardFileDetailStub({
          value: `${String(queryPath)}\n  lint no-any (line 10, col 3)\n    No any allowed`,
        }),
      );
    });

    it('VALID: {query: absolute path, stored: package-relative path} => matches and returns errors', () => {
      const storedPath = 'src/guards/is-check-type/is-check-type-guard.ts';
      const { filePath: queryPath } = ErrorEntryStub({
        filePath:
          '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.ts',
      });
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
                    filePath: storedPath,
                    line: 7,
                    column: 2,
                    message: 'TS2345: Argument not assignable',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath: queryPath });

      expect(result).toBe(
        WardFileDetailStub({
          value: `${String(queryPath)}\n  typecheck (line 7, col 2)\n    TS2345: Argument not assignable`,
        }),
      );
    });

    it('VALID: {query: absolute path, stored: package-relative suitePath} => matches test failures', () => {
      const storedSuitePath = 'src/guards/is-check-type/is-check-type-guard.test.ts';
      const { suitePath: queryPath } = TestFailureStub({
        suitePath:
          '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts',
      });
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
                    suitePath: storedSuitePath,
                    testName: 'should validate',
                    message: 'Expected true, received false',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath: queryPath });

      expect(result).toBe(
        WardFileDetailStub({
          value: `${String(queryPath)}\n  FAIL  "should validate"\n    Expected true, received false`,
        }),
      );
    });

    it('EMPTY: {query: unrelated path, stored: absolute path} => returns file path only', () => {
      const storedPath =
        '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.ts';
      const { filePath: queryPath } = ErrorEntryStub({
        filePath: 'packages/other/src/completely-different.ts',
      });
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
                    filePath: storedPath,
                    line: 5,
                    column: 1,
                    rule: 'no-unused-vars',
                    message: 'Unused variable',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath: queryPath });

      expect(result).toBe(WardFileDetailStub({ value: String(queryPath) }));
    });
  });

  describe('no filePath (all errors)', () => {
    it('EMPTY: {wardResult: no checks, no filePath} => returns no errors found', () => {
      const wardResult = WardResultStub({ checks: [] });

      const result = resultToDetailTransformer({ wardResult });

      expect(result).toBe(WardFileDetailStub({ value: 'No errors found' }));
    });

    it('VALID: {wardResult: lint + test errors, no filePath} => returns all errors grouped by file', () => {
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
                    message: 'Unused variable x',
                  }),
                ],
                testFailures: [
                  TestFailureStub({
                    suitePath: 'src/app.test.ts',
                    testName: 'should work',
                    message: 'Expected true',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult });

      expect(result).toBe(
        WardFileDetailStub({
          value:
            'src/app.ts\n  lint no-unused-vars (line 5, col 1)\n    Unused variable x\n\nsrc/app.test.ts\n  FAIL  "should work"\n    Expected true',
        }),
      );
    });
  });

  describe('crash projects (no filePath)', () => {
    it('VALID: {wardResult: fail with testFailures and stack traces} => returns failures with stack traces and not-run files', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'e2e',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [],
                testFailures: [
                  TestFailureStub({
                    suitePath: 'e2e/web/quest.spec.ts',
                    testName: 'Quest › fails',
                    message: 'Error: timeout exceeded',
                    stackTrace: 'at /project/e2e/web/quest.spec.ts:25:10',
                  }),
                ],
                onlyDiscovered: ['e2e/web/visual.spec.ts'],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult });

      expect(result).toBe(
        WardFileDetailStub({
          value: [
            'e2e/web/quest.spec.ts',
            '  FAIL  "Quest › fails"',
            '    Error: timeout exceeded',
            '    at /project/e2e/web/quest.spec.ts:25:10',
            '',
            'not run (1 files):',
            '  e2e/web/visual.spec.ts',
          ].join('\n'),
        }),
      );
    });

    it('VALID: {wardResult: fail with no output} => returns crash with no output captured message', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'e2e',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [],
                testFailures: [],
                rawOutput: { stdout: '', stderr: '', exitCode: 1 },
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult });

      expect(result).toBe(
        WardFileDetailStub({
          value: 'ward\n  (crash) e2e\n    no output captured',
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

  describe('passing tests (no filePath)', () => {
    it('VALID: {passing project with passingTests} => emits pass block per project', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'ward', path: '/repo/packages/ward' },
                status: 'pass',
                filesCount: 1,
                passingTests: [
                  PassingTestStub({
                    suitePath: 'src/foo.test.ts',
                    testName: 'VALID: {a} => b',
                    durationMs: 15,
                  }),
                  PassingTestStub({
                    suitePath: 'src/foo.test.ts',
                    testName: 'VALID: {c} => d',
                    durationMs: 7,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult });

      expect(result).toBe(
        WardFileDetailStub({
          value: [
            'ward',
            '  unit  PASS  (1 files, 2 tests)',
            '    ✓ src/foo.test.ts › VALID: {a} => b (15ms)',
            '    ✓ src/foo.test.ts › VALID: {c} => d (7ms)',
          ].join('\n'),
        }),
      );
    });

    it('VALID: {passing project with no passingTests} => omits pass block', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'ward', path: '/repo/packages/ward' },
                status: 'pass',
                passingTests: [],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult });

      expect(result).toBe(WardFileDetailStub({ value: 'No errors found' }));
    });

    it('VALID: {e2e pass with single file and cumulative duration} => reports total duration', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'e2e',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'testing', path: '/repo/packages/testing' },
                status: 'pass',
                filesCount: 1,
                passingTests: [
                  PassingTestStub({
                    suitePath: 'e2e/web/echo-badge.spec.ts',
                    testName: 'Echo Badge › renders',
                    durationMs: 6000,
                  }),
                  PassingTestStub({
                    suitePath: 'e2e/web/echo-badge.spec.ts',
                    testName: 'Echo Badge › does something else',
                    durationMs: 1000,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult });

      expect(result).toBe(
        WardFileDetailStub({
          value: [
            'testing',
            '  e2e  PASS  (1 files, 2 tests, 7.0s)',
            '    ✓ e2e/web/echo-badge.spec.ts › Echo Badge › renders (6000ms)',
            '    ✓ e2e/web/echo-badge.spec.ts › Echo Badge › does something else (1000ms)',
          ].join('\n'),
        }),
      );
    });

    it('VALID: {fail project also has passingTests} => pass block omitted on fail', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'ward', path: '/repo/packages/ward' },
                status: 'fail',
                testFailures: [
                  TestFailureStub({
                    suitePath: 'src/app.test.ts',
                    testName: 'fails',
                    message: 'boom',
                  }),
                ],
                passingTests: [
                  PassingTestStub({
                    suitePath: 'src/app.test.ts',
                    testName: 'passes',
                    durationMs: 10,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult });

      expect(result).toBe(
        WardFileDetailStub({
          value: 'src/app.test.ts\n  FAIL  "fails"\n    boom',
        }),
      );
    });
  });

  describe('passing tests (with filePath)', () => {
    it('VALID: {passingTests matching filePath} => includes PASS entries in file detail', () => {
      const { filePath } = ErrorEntryStub({ filePath: 'src/foo.test.ts' });
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                status: 'pass',
                passingTests: [
                  PassingTestStub({
                    suitePath: 'src/foo.test.ts',
                    testName: 'VALID: {a} => b',
                    durationMs: 15,
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
          value: 'src/foo.test.ts\n  PASS  "VALID: {a} => b" (15ms)',
        }),
      );
    });

    it('VALID: {passingTests in different file} => file path only', () => {
      const { filePath } = ErrorEntryStub({ filePath: 'src/target.test.ts' });
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                status: 'pass',
                passingTests: [
                  PassingTestStub({
                    suitePath: 'src/other.test.ts',
                    testName: 'ok',
                    durationMs: 1,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const result = resultToDetailTransformer({ wardResult, filePath });

      expect(result).toBe(WardFileDetailStub({ value: String(filePath) }));
    });
  });
});
