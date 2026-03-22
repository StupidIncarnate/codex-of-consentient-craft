import { FileContentsStub } from '@dungeonmaster/shared/contracts';

import { parseBatchFileTransformer } from './parse-batch-file-transformer';

describe('parseBatchFileTransformer', () => {
  describe('valid batch file', () => {
    it('VALID: {batch with filePaths and errors} => returns parsed arrays', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({
          filePaths: ['/src/app.ts'],
          errors: ['line 10: Unexpected any'],
        }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({
        filePaths: ['/src/app.ts'],
        errors: ['line 10: Unexpected any'],
      });
    });

    it('VALID: {batch with multiple files} => returns all file paths and errors', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({
          filePaths: ['/src/a.ts', '/src/b.ts'],
          errors: ['error a', 'error b'],
        }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({
        filePaths: ['/src/a.ts', '/src/b.ts'],
        errors: ['error a', 'error b'],
      });
    });
  });

  describe('empty batch file', () => {
    it('VALID: {batch with empty arrays} => returns empty arrays', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ filePaths: [], errors: [] }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: [] });
    });
  });

  describe('invalid content', () => {
    it('EDGE: {non-object JSON} => returns empty arrays', () => {
      const contents = FileContentsStub({ value: '"just a string"' });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: [] });
    });

    it('EDGE: {null JSON} => returns empty arrays', () => {
      const contents = FileContentsStub({ value: 'null' });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: [] });
    });

    it('ERROR: {malformed JSON} => throws SyntaxError', () => {
      const contents = FileContentsStub({ value: '{not valid json' });

      expect(() => parseBatchFileTransformer({ contents })).toThrow(
        /Expected property name|Unexpected token/u,
      );
    });
  });

  describe('missing fields', () => {
    it('EDGE: {no filePaths key} => returns empty filePaths', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ errors: ['some error'] }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: ['some error'] });
    });

    it('EDGE: {no errors key} => returns empty errors', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ filePaths: ['/src/file.ts'] }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: ['/src/file.ts'], errors: [] });
    });

    it('EDGE: {filePaths is not an array} => returns empty filePaths', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ filePaths: 'not-array', errors: [] }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: [] });
    });

    it('EDGE: {errors is not an array} => returns empty errors', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ filePaths: [], errors: 'not-array' }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: [] });
    });
  });

  describe('non-string and invalid items', () => {
    it('EDGE: {filePaths contains non-string item} => skips non-string items', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ filePaths: [123, '/src/valid.ts'], errors: [] }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: ['/src/valid.ts'], errors: [] });
    });

    it('EDGE: {filePaths contains non-absolute path} => skips non-absolute paths', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ filePaths: ['relative/path.ts', '/src/valid.ts'], errors: [] }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: ['/src/valid.ts'], errors: [] });
    });

    it('EDGE: {errors contains non-string item} => skips non-string items', () => {
      const contents = FileContentsStub({
        value: JSON.stringify({ filePaths: [], errors: [42, 'valid error'] }),
      });

      const result = parseBatchFileTransformer({ contents });

      expect(result).toStrictEqual({ filePaths: [], errors: ['valid error'] });
    });
  });
});
