import { FileContentsStub } from '@dungeonmaster/shared/contracts';

import { wardOutputToFilePathsTransformer } from './ward-output-to-file-paths-transformer';

describe('wardOutputToFilePathsTransformer', () => {
  describe('ward result with error file paths', () => {
    it('VALID: {single error with filePath} => returns array with one path', () => {
      const wardResultJson = FileContentsStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              status: 'fail',
              projectResults: [
                {
                  projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
                  status: 'fail',
                  errors: [
                    {
                      filePath: '/src/brokers/test/test-broker.ts',
                      line: 5,
                      column: 1,
                      message: 'Unexpected any',
                      severity: 'error',
                    },
                  ],
                  testFailures: [],
                  rawOutput: { stdout: '', stderr: '', exitCode: 1 },
                },
              ],
            },
          ],
        }),
      });

      const result = wardOutputToFilePathsTransformer({ wardResultJson });

      expect(result).toStrictEqual(['/src/brokers/test/test-broker.ts']);
    });

    it('VALID: {multiple errors across checks} => returns deduplicated array', () => {
      const wardResultJson = FileContentsStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              status: 'fail',
              projectResults: [
                {
                  projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
                  status: 'fail',
                  errors: [
                    {
                      filePath: '/src/brokers/auth/auth-broker.ts',
                      line: 1,
                      column: 1,
                      message: 'err',
                      severity: 'error',
                    },
                    {
                      filePath: '/src/contracts/user/user-contract.ts',
                      line: 2,
                      column: 1,
                      message: 'err',
                      severity: 'error',
                    },
                  ],
                  testFailures: [],
                  rawOutput: { stdout: '', stderr: '', exitCode: 1 },
                },
              ],
            },
            {
              checkType: 'typecheck',
              status: 'fail',
              projectResults: [
                {
                  projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
                  status: 'fail',
                  errors: [
                    {
                      filePath: '/src/brokers/auth/auth-broker.ts',
                      line: 10,
                      column: 5,
                      message: 'err',
                      severity: 'error',
                    },
                  ],
                  testFailures: [],
                  rawOutput: { stdout: '', stderr: '', exitCode: 1 },
                },
              ],
            },
          ],
        }),
      });

      const result = wardOutputToFilePathsTransformer({ wardResultJson });

      expect(result).toStrictEqual([
        '/src/brokers/auth/auth-broker.ts',
        '/src/contracts/user/user-contract.ts',
      ]);
    });
  });

  describe('ward result with test failure paths', () => {
    it('VALID: {test failure with suitePath} => returns suite path', () => {
      const wardResultJson = FileContentsStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'test',
              status: 'fail',
              projectResults: [
                {
                  projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
                  status: 'fail',
                  errors: [],
                  testFailures: [
                    {
                      suitePath: '/src/brokers/test/test-broker.test.ts',
                      testName: 'should work',
                      message: 'Expected true',
                    },
                  ],
                  rawOutput: { stdout: '', stderr: '', exitCode: 1 },
                },
              ],
            },
          ],
        }),
      });

      const result = wardOutputToFilePathsTransformer({ wardResultJson });

      expect(result).toStrictEqual(['/src/brokers/test/test-broker.test.ts']);
    });

    it('VALID: {errors and test failures mixed} => returns all unique paths', () => {
      const wardResultJson = FileContentsStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'test',
              status: 'fail',
              projectResults: [
                {
                  projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
                  status: 'fail',
                  errors: [
                    {
                      filePath: '/src/file-a.ts',
                      line: 1,
                      column: 1,
                      message: 'err',
                      severity: 'error',
                    },
                  ],
                  testFailures: [
                    { suitePath: '/src/file-b.test.ts', testName: 'test', message: 'fail' },
                  ],
                  rawOutput: { stdout: '', stderr: '', exitCode: 1 },
                },
              ],
            },
          ],
        }),
      });

      const result = wardOutputToFilePathsTransformer({ wardResultJson });

      expect(result).toStrictEqual(['/src/file-a.ts', '/src/file-b.test.ts']);
    });
  });

  describe('ward result with no failing paths', () => {
    it('EMPTY: {all checks pass with empty errors} => returns empty array', () => {
      const wardResultJson = FileContentsStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              status: 'pass',
              projectResults: [
                {
                  projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
                  status: 'pass',
                  errors: [],
                  testFailures: [],
                  rawOutput: { stdout: '', stderr: '', exitCode: 0 },
                },
              ],
            },
          ],
        }),
      });

      const result = wardOutputToFilePathsTransformer({ wardResultJson });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty checks array} => returns empty array', () => {
      const wardResultJson = FileContentsStub({
        value: JSON.stringify({ checks: [] }),
      });

      const result = wardOutputToFilePathsTransformer({ wardResultJson });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {no checks key in JSON} => returns empty array', () => {
      const wardResultJson = FileContentsStub({
        value: JSON.stringify({ runId: '123', timestamp: 0 }),
      });

      const result = wardOutputToFilePathsTransformer({ wardResultJson });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {non-absolute filePath in error} => skips invalid path', () => {
      const wardResultJson = FileContentsStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              status: 'fail',
              projectResults: [
                {
                  projectFolder: { name: 'orchestrator', path: '/project/packages/orchestrator' },
                  status: 'fail',
                  errors: [
                    {
                      filePath: 'relative/path.ts',
                      line: 1,
                      column: 1,
                      message: 'err',
                      severity: 'error',
                    },
                  ],
                  testFailures: [],
                  rawOutput: { stdout: '', stderr: '', exitCode: 1 },
                },
              ],
            },
          ],
        }),
      });

      const result = wardOutputToFilePathsTransformer({ wardResultJson });

      expect(result).toStrictEqual([]);
    });
  });
});
