import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { wardDetailToSpiritmenderBatchesTransformer } from './ward-detail-to-spiritmender-batches-transformer';

const BATCH_SIZE_TWO = 2;
const BATCH_SIZE_THREE = 3;

describe('wardDetailToSpiritmenderBatchesTransformer', () => {
  describe('empty detail', () => {
    it('EMPTY: {no checks} => returns empty array', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({ checks: [] }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {checks with no errors or failures} => returns empty array', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [{ errors: [], testFailures: [] }],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single error', () => {
    it('VALID: {one lint error} => returns single batch with one file', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [
                {
                  errors: [
                    {
                      filePath: '/src/file.ts',
                      line: 5,
                      column: 10,
                      message: 'Unexpected any',
                      rule: 'no-explicit-any',
                    },
                  ],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/file.ts'],
          errors: ['/src/file.ts:5:10 Unexpected any (no-explicit-any)'],
        },
      ]);
    });
  });

  describe('multiple errors across files', () => {
    it('VALID: {errors in two files} => groups errors by file path', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [
                {
                  errors: [
                    {
                      filePath: '/src/a.ts',
                      line: 1,
                      column: 1,
                      message: 'error one',
                    },
                    {
                      filePath: '/src/b.ts',
                      line: 2,
                      column: 3,
                      message: 'error two',
                    },
                    {
                      filePath: '/src/a.ts',
                      line: 10,
                      column: 5,
                      message: 'error three',
                    },
                  ],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_THREE,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/a.ts', '/src/b.ts'],
          errors: [
            '/src/a.ts:1:1 error one',
            '/src/a.ts:10:5 error three',
            '/src/b.ts:2:3 error two',
          ],
        },
      ]);
    });
  });

  describe('test failures', () => {
    it('VALID: {test failure with stack trace} => formats with suite path and stack', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'unit',
              projectResults: [
                {
                  errors: [],
                  testFailures: [
                    {
                      suitePath: '/src/test.test.ts',
                      testName: 'should work',
                      message: 'Expected true to be false',
                      stackTrace: 'at Object.<anonymous> (test.ts:5)',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/test.test.ts'],
          errors: [
            '/src/test.test.ts - should work: Expected true to be false Stack: at Object.<anonymous> (test.ts:5)',
          ],
        },
      ]);
    });
  });

  describe('batching behavior', () => {
    it('VALID: {three files, batchSize 2} => splits into two batches', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [
                {
                  errors: [
                    { filePath: '/src/a.ts', line: 1, column: 1, message: 'err a' },
                    { filePath: '/src/b.ts', line: 1, column: 1, message: 'err b' },
                    { filePath: '/src/c.ts', line: 1, column: 1, message: 'err c' },
                  ],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/a.ts', '/src/b.ts'],
          errors: ['/src/a.ts:1:1 err a', '/src/b.ts:1:1 err b'],
        },
        {
          filePaths: ['/src/c.ts'],
          errors: ['/src/c.ts:1:1 err c'],
        },
      ]);
    });

    it('VALID: {two files, batchSize 2} => fits in single batch', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [
                {
                  errors: [
                    { filePath: '/src/x.ts', line: 1, column: 1, message: 'err x' },
                    { filePath: '/src/y.ts', line: 1, column: 1, message: 'err y' },
                  ],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/x.ts', '/src/y.ts'],
          errors: ['/src/x.ts:1:1 err x', '/src/y.ts:1:1 err y'],
        },
      ]);
    });
  });

  describe('mixed errors and test failures', () => {
    it('VALID: {lint error and test failure in same file} => merges into one batch', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [
                {
                  errors: [{ filePath: '/src/file.ts', line: 5, column: 1, message: 'lint err' }],
                  testFailures: [],
                },
              ],
            },
            {
              checkType: 'unit',
              projectResults: [
                {
                  errors: [],
                  testFailures: [
                    {
                      suitePath: '/src/file.ts',
                      testName: 'test case',
                      message: 'test failed',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/file.ts'],
          errors: ['/src/file.ts:5:1 lint err', '/src/file.ts - test case: test failed'],
        },
      ]);
    });
  });

  describe('non-object input', () => {
    it('EDGE: {parsed JSON is array} => returns empty array', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify([1, 2, 3]),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {parsed JSON is string} => returns empty array', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify('just a string'),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('batch size boundary', () => {
    it('EDGE: {batchSize larger than file count} => all files in one batch', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [
                {
                  errors: [
                    { filePath: '/src/a.ts', line: 1, column: 1, message: 'err a' },
                    { filePath: '/src/b.ts', line: 2, column: 2, message: 'err b' },
                  ],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const batchSizeTen = 10;
      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: batchSizeTen,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/a.ts', '/src/b.ts'],
          errors: ['/src/a.ts:1:1 err a', '/src/b.ts:2:2 err b'],
        },
      ]);
    });

    it('EDGE: {file count exactly divisible by batchSize} => even batches', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [
                {
                  errors: [
                    { filePath: '/src/a.ts', line: 1, column: 1, message: 'err a' },
                    { filePath: '/src/b.ts', line: 1, column: 1, message: 'err b' },
                    { filePath: '/src/c.ts', line: 1, column: 1, message: 'err c' },
                  ],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_THREE,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/a.ts', '/src/b.ts', '/src/c.ts'],
          errors: ['/src/a.ts:1:1 err a', '/src/b.ts:1:1 err b', '/src/c.ts:1:1 err c'],
        },
      ]);
    });
  });

  describe('malformed nested structures', () => {
    it('EDGE: {non-object check entry} => skips it', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: ['not-an-object', null, { projectResults: [] }],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {non-object projectResult entry} => skips it', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              projectResults: ['not-an-object', null],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {non-object error entry} => skips it', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              projectResults: [
                {
                  errors: ['not-an-object', null, 42],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {error with non-string filePath} => skips it', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              projectResults: [
                {
                  errors: [{ filePath: 123, message: 'err' }],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {testFailure with non-string suitePath} => skips it', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              projectResults: [
                {
                  errors: [],
                  testFailures: [{ suitePath: 42, testName: 'test', message: 'fail' }],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {non-object testFailure entry} => skips it', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              projectResults: [
                {
                  errors: [],
                  testFailures: ['not-an-object', null],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('test failure formatting variations', () => {
    it('EDGE: {test failure with empty stackTrace} => formats without stack prefix', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'unit',
              projectResults: [
                {
                  errors: [],
                  testFailures: [
                    {
                      suitePath: '/src/test.test.ts',
                      testName: 'case',
                      message: 'failed',
                      stackTrace: '',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/test.test.ts'],
          errors: ['/src/test.test.ts - case: failed'],
        },
      ]);
    });

    it('EDGE: {test failure without testName or message} => formats with suitePath only', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'unit',
              projectResults: [
                {
                  errors: [],
                  testFailures: [
                    {
                      suitePath: '/src/test.test.ts',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/test.test.ts'],
          errors: ['/src/test.test.ts'],
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {error without line/column/rule} => formats with file path and message only', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'typecheck',
              projectResults: [
                {
                  errors: [{ filePath: '/src/broken.ts', message: 'Type error' }],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/broken.ts'],
          errors: ['/src/broken.ts Type error'],
        },
      ]);
    });

    it('EDGE: {non-absolute file path in error} => skips that error', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'lint',
              projectResults: [
                {
                  errors: [{ filePath: 'relative/path.ts', line: 1, column: 1, message: 'err' }],
                  testFailures: [],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {test failure without stack trace} => formats without stack prefix', () => {
      const detailJson = ErrorMessageStub({
        value: JSON.stringify({
          checks: [
            {
              checkType: 'unit',
              projectResults: [
                {
                  errors: [],
                  testFailures: [
                    {
                      suitePath: '/src/test.test.ts',
                      testName: 'case',
                      message: 'failed',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      const result = wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: BATCH_SIZE_TWO,
      });

      expect(result).toStrictEqual([
        {
          filePaths: ['/src/test.test.ts'],
          errors: ['/src/test.test.ts - case: failed'],
        },
      ]);
    });
  });
});
