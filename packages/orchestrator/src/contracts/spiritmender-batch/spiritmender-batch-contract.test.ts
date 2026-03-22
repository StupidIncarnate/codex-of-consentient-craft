import { spiritmenderBatchContract } from './spiritmender-batch-contract';
import { SpiritmenderBatchStub } from './spiritmender-batch.stub';

type SpiritmenderBatch = ReturnType<typeof SpiritmenderBatchStub>;

describe('spiritmenderBatchContract', () => {
  describe('valid batches', () => {
    it('VALID: {filePaths, errors} => parses successfully', () => {
      const result = spiritmenderBatchContract.parse({
        filePaths: ['/src/file.ts'],
        errors: ['line 5: error'],
      });

      expect(result).toStrictEqual({
        filePaths: ['/src/file.ts'],
        errors: ['line 5: error'],
      });
    });

    it('VALID: {empty arrays} => parses successfully', () => {
      const result = spiritmenderBatchContract.parse({
        filePaths: [],
        errors: [],
      });

      expect(result).toStrictEqual({
        filePaths: [],
        errors: [],
      });
    });

    it('VALID: {multiple filePaths and errors} => parses all entries', () => {
      const result = spiritmenderBatchContract.parse({
        filePaths: ['/src/a.ts', '/src/b.ts'],
        errors: ['error 1', 'error 2', 'error 3'],
      });

      expect(result).toStrictEqual({
        filePaths: ['/src/a.ts', '/src/b.ts'],
        errors: ['error 1', 'error 2', 'error 3'],
      });
    });
  });

  describe('stub', () => {
    it('VALID: stub default => returns default batch', () => {
      const batch: SpiritmenderBatch = SpiritmenderBatchStub();

      expect(batch).toStrictEqual({
        filePaths: ['/src/brokers/test/test-broker.ts'],
        errors: ['line 5: Unexpected any'],
      });
    });

    it('VALID: stub with overrides => returns customized batch', () => {
      const batch: SpiritmenderBatch = SpiritmenderBatchStub({
        filePaths: ['/src/custom.ts'],
        errors: ['custom error'],
      });

      expect(batch).toStrictEqual({
        filePaths: ['/src/custom.ts'],
        errors: ['custom error'],
      });
    });
  });

  describe('invalid batches', () => {
    it('INVALID_MULTIPLE: {missing filePaths and errors} => throws validation error', () => {
      expect(() => spiritmenderBatchContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID_TYPE: {filePaths: string} => throws validation error', () => {
      expect(() => spiritmenderBatchContract.parse({ filePaths: 'not-array', errors: [] })).toThrow(
        /Expected array/u,
      );
    });

    it('INVALID_TYPE: {filePaths contains non-absolute path} => throws validation error', () => {
      expect(() =>
        spiritmenderBatchContract.parse({
          filePaths: ['relative/path.ts'],
          errors: [],
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID_TYPE: {errors: string} => throws validation error', () => {
      expect(() => spiritmenderBatchContract.parse({ filePaths: [], errors: 'not-array' })).toThrow(
        /Expected array/u,
      );
    });
  });
});
